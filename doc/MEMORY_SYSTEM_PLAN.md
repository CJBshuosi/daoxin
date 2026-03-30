# 道心文案 · 智能记忆系统实现方案

> 目标：让工具"越用越聪明"，自动学习用户的写作偏好、成功模式和内容禁忌。
> 参考：Mem0、LangChain Content Writer、ChatGPT Memory、Jasper Brand Voice

---

## 一、当前问题分析

现有记忆系统：`Track.memory: string`，通过 `appendMemory` 拼接 AI 返回的一句话总结。

| 问题 | 影响 |
|---|---|
| 纯文本拼接，无结构 | 无法区分风格偏好 vs 内容禁忌 vs 成功模式 |
| 只增不减 | 记忆无限增长，最终超出 prompt token 限制 |
| 无去重/冲突处理 | "喜欢引用古籍"可能出现 10 次 |
| 无权重机制 | 第 1 次和第 100 次观察同等对待 |
| 只有 AI 被动记忆 | 用户无法主动纠正错误记忆 |
| 全量注入 prompt | 不区分相关性，浪费 token |

---

## 二、新架构设计

### 2.1 数据模型

```typescript
// src/types/memory.ts

/** 记忆类型 */
export type MemoryType = 'style' | 'content' | 'avoid' | 'pattern';

/** 单条记忆 */
export interface MemoryEntry {
  id: string;
  trackId: string;            // 属于哪个赛道（'global' = 跨赛道通用）
  type: MemoryType;
  content: string;            // 规则内容，一句话描述
  source: 'ai' | 'user';     // AI 自动提取 or 用户手动添加
  confidence: number;         // 0.0 ~ 1.0，被验证越多次越高
  hitCount: number;           // 被注入 prompt 的次数
  createdAt: number;          // timestamp
  updatedAt: number;          // timestamp
  relatedTopics?: string[];   // 相关主题标签（用于检索）
}

/** 记忆类型定义 */
export const MEMORY_TYPES: Record<MemoryType, { label: string; color: string; desc: string }> = {
  style:   { label: '风格偏好', color: '#8b5cf6', desc: '写作风格、语气、表达方式' },
  content: { label: '内容偏好', color: '#3b82f6', desc: '喜欢的素材、引用、主题方向' },
  avoid:   { label: '需要避免', color: '#ef4444', desc: '不喜欢的表达、禁忌内容' },
  pattern: { label: '成功模式', color: '#10b981', desc: 'AI 发现的高效创作模式' },
};
```

### 2.2 Track 模型变更

```typescript
// Track 接口变更
export interface Track {
  id: string;
  name: string;
  desc: string;
  color: string;
  banned: string;
  fewShot: string;
  refAccounts: string[];
  count: number;
  // 旧字段（兼容过渡，后续废弃）
  memory: string;
  // 新字段
  memories: MemoryEntry[];    // 结构化记忆列表
}
```

### 2.3 记忆存储（Zustand Store）

```typescript
// src/store/useMemoryStore.ts（或扩展现有 useTrackStore）

interface MemoryActions {
  // 添加记忆（AI 或用户手动）
  addMemory: (trackId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'hitCount'>) => void;

  // 更新记忆（用户编辑）
  updateMemory: (memoryId: string, updates: Partial<Pick<MemoryEntry, 'content' | 'type' | 'confidence'>>) => void;

  // 删除记忆
  deleteMemory: (memoryId: string) => void;

  // AI 提取记忆后的智能合并（核心方法）
  mergeAIMemories: (trackId: string, newEntries: AIMemoryExtraction[]) => void;

  // 获取某赛道的记忆（按相关性排序）
  getRelevantMemories: (trackId: string, topic: string, limit?: number) => MemoryEntry[];

  // 衰减：降低长期未更新的记忆的 confidence
  decayMemories: (trackId: string) => void;

  // 记录某条记忆被使用（+hitCount）
  touchMemory: (memoryId: string) => void;
}
```

---

## 三、核心机制详解

### 3.1 AI 自动提取（每次生成后）

**当前**：AI 返回 `memory_update: "一句话总结"`

**新方案**：AI 返回结构化记忆数组

```typescript
// AI 返回的记忆提取结果
interface AIMemoryExtraction {
  type: MemoryType;
  content: string;
  relatedTopics?: string[];
}

// Step 4 的输出 schema 变更
const step4Schema = z.object({
  copytext: z.string(),
  titles: z.array(z.string()),
  music: z.array(z.string()),
  // 新：结构化记忆提取
  memory_entries: z.array(z.object({
    type: z.enum(['style', 'content', 'avoid', 'pattern']),
    content: z.string().describe('一句话规则描述'),
    relatedTopics: z.array(z.string()).optional(),
  })).describe('从本次生成中提取的用户偏好和创作规律，2-4条'),
});
```

**Prompt 变更**（Step 4 末尾）：

```
【记忆提取要求】
基于本次生成过程，提取 2-4 条创作规律或用户偏好：
- style: 写作风格发现（如"用户偏好口语化表达"）
- content: 内容偏好发现（如"用户喜欢结合古籍引用"）
- avoid: 需要避免的（如"不要使用emoji"）
- pattern: 成功模式（如"反常识钩子在养生赛道完播率高"）

只提取有价值的、可复用的规律，不要重复已有记忆中的内容。
```

### 3.2 智能去重合并（核心算法）

新记忆写入前，与已有记忆比对：

```typescript
async function mergeAIMemories(trackId: string, newEntries: AIMemoryExtraction[]) {
  const existing = getMemories(trackId);

  for (const entry of newEntries) {
    // 1. 在同类型记忆中寻找相似的
    const similar = findSimilar(existing, entry);

    if (similar && similar.similarity > 0.8) {
      // 高相似度 → 合并：提升 confidence，更新时间
      updateMemory(similar.id, {
        confidence: Math.min(1.0, similar.confidence + 0.1),
      });
    } else if (similar && similar.similarity > 0.6) {
      // 中等相似度 → 可能是更新版本，替换内容
      updateMemory(similar.id, {
        content: entry.content,  // 用新描述替换旧的
        confidence: Math.min(1.0, similar.confidence + 0.05),
      });
    } else {
      // 低相似度 → 全新记忆
      addMemory(trackId, {
        ...entry,
        source: 'ai',
        confidence: 0.3,  // 新记忆初始 confidence 较低
      });
    }
  }
}
```

**相似度计算**（简单版，不依赖向量数据库）：

```typescript
function findSimilar(memories: MemoryEntry[], candidate: AIMemoryExtraction) {
  // Phase 1: 先按 type 过滤
  const sameType = memories.filter(m => m.type === candidate.type);

  // Phase 2: 关键词重叠度
  const candidateWords = new Set(segment(candidate.content));  // 中文分词
  let bestMatch: { entry: MemoryEntry; similarity: number } | null = null;

  for (const mem of sameType) {
    const memWords = new Set(segment(mem.content));
    const intersection = [...candidateWords].filter(w => memWords.has(w));
    const similarity = intersection.length / Math.max(candidateWords.size, memWords.size);

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { entry: mem, similarity };
    }
  }

  return bestMatch;
}
```

> **进阶版**：如果后续上了 Supabase，可以用 pgvector 做 embedding 级别的语义相似度。
> 当前阶段用关键词重叠 + 同类型过滤已经够用。

### 3.3 用户主动记忆管理

用户可以：

| 操作 | 触发方式 | 效果 |
|---|---|---|
| 查看所有记忆 | 侧边栏 Memory 面板 | 按类型分组展示 |
| 手动添加记忆 | 点击"+ 添加规则" | source='user', confidence=0.9 |
| 编辑记忆 | 点击编辑按钮 | 更新 content, updatedAt |
| 删除记忆 | 点击删除按钮 | 永久删除 |
| 点赞/确认记忆 | 点击 👍 | confidence += 0.2 |
| 否决记忆 | 点击 👎 | confidence -= 0.3，低于 0 自动删除 |
| 从生成结果中提取 | 完成生成后弹出记忆卡片 | 用户可勾选保留哪些 |

### 3.4 智能注入（Prompt 构建时）

不再全量注入，而是选择最相关的 top-N 条：

```typescript
function buildMemoryPrompt(trackId: string, topic: string, maxTokenBudget = 500): string {
  // 1. 获取该赛道 + 全局记忆
  const trackMemories = getMemories(trackId);
  const globalMemories = getMemories('global');
  const all = [...trackMemories, ...globalMemories];

  // 2. 排序：confidence × recency × topicRelevance
  const scored = all.map(m => ({
    ...m,
    score: calculateScore(m, topic),
  })).sort((a, b) => b.score - a.score);

  // 3. 按 token 预算截取
  const selected: MemoryEntry[] = [];
  let tokenCount = 0;
  for (const m of scored) {
    const tokens = estimateTokens(m.content);
    if (tokenCount + tokens > maxTokenBudget) break;
    selected.push(m);
    tokenCount += tokens;
  }

  // 4. 按类型分组格式化
  const grouped = groupBy(selected, 'type');
  let prompt = '【用户偏好记忆】\n';

  if (grouped.style?.length) {
    prompt += '风格偏好：\n' + grouped.style.map(m => `- ${m.content}`).join('\n') + '\n';
  }
  if (grouped.content?.length) {
    prompt += '内容偏好：\n' + grouped.content.map(m => `- ${m.content}`).join('\n') + '\n';
  }
  if (grouped.avoid?.length) {
    prompt += '必须避免：\n' + grouped.avoid.map(m => `- ${m.content}`).join('\n') + '\n';
  }
  if (grouped.pattern?.length) {
    prompt += '成功模式：\n' + grouped.pattern.map(m => `- ${m.content}`).join('\n') + '\n';
  }

  // 5. 标记使用
  selected.forEach(m => touchMemory(m.id));

  return prompt;
}

function calculateScore(memory: MemoryEntry, topic: string): number {
  const confidenceWeight = memory.confidence;                           // 0~1
  const recencyWeight = 1 / (1 + daysSince(memory.updatedAt) / 30);   // 30天衰减
  const sourceWeight = memory.source === 'user' ? 1.2 : 1.0;          // 用户手动加的更重要
  const topicWeight = hasTopicOverlap(memory, topic) ? 1.5 : 1.0;     // 主题相关性加权

  return confidenceWeight * recencyWeight * sourceWeight * topicWeight;
}
```

### 3.5 定期衰减

```typescript
function decayMemories(trackId: string) {
  const memories = getMemories(trackId);
  const now = Date.now();

  for (const m of memories) {
    const daysSinceUpdate = (now - m.updatedAt) / (1000 * 60 * 60 * 24);

    // 超过 60 天未更新的 AI 记忆，开始衰减
    if (m.source === 'ai' && daysSinceUpdate > 60) {
      const newConfidence = m.confidence * 0.95;  // 每次衰减 5%
      if (newConfidence < 0.1) {
        deleteMemory(m.id);  // 过低直接删除
      } else {
        updateMemory(m.id, { confidence: newConfidence });
      }
    }
    // 用户手动添加的记忆不衰减
  }
}

// 在每次打开应用时调用一次
useEffect(() => {
  decayMemories(currentTrackId);
}, [currentTrackId]);
```

---

## 四、UI 设计

### 4.1 侧边栏记忆面板（替代当前的纯文本展示）

```
┌──────────────────────────┐
│ 当前TRACK记忆    [+ 添加] │
│ 道家养生 · 12条记忆       │
├──────────────────────────┤
│                          │
│ 🎨 风格偏好 (4)           │
│ ┌────────────────────┐   │
│ │ 口语化表达，像朋友聊天 │   │
│ │ ★★★★☆  AI · 30天前  │   │
│ │            [👍] [✏️] [🗑] │
│ └────────────────────┘   │
│ ┌────────────────────┐   │
│ │ 多用短句排比增强节奏感 │   │
│ │ ★★★☆☆  AI · 12天前  │   │
│ └────────────────────┘   │
│                          │
│ 📚 内容偏好 (3)           │
│ ┌────────────────────┐   │
│ │ 结合《本草纲目》等古籍 │   │
│ │ ★★★★★  用户 · 5天前  │   │
│ └────────────────────┘   │
│                          │
│ 🚫 需要避免 (3)           │
│ ┌────────────────────┐   │
│ │ 不要使用emoji表情      │   │
│ │ ★★★★☆  用户 · 2天前  │   │
│ └────────────────────┘   │
│                          │
│ ✨ 成功模式 (2)           │
│ ┌────────────────────┐   │
│ │ 反常识钩子在养生赛道   │   │
│ │ 完播率最高             │   │
│ │ ★★★☆☆  AI · 7天前   │   │
│ └────────────────────┘   │
│                          │
│     [编辑全部记忆]        │
└──────────────────────────┘
```

### 4.2 生成后记忆确认卡片

每次 Step 4 完成后，在结果下方弹出：

```
┌──────────────────────────────────────────┐
│ 💡 AI 发现了以下创作规律，要保存吗？        │
├──────────────────────────────────────────┤
│ ☑ [风格] 用户偏好体验式描述（口感、香味）   │
│ ☑ [内容] 古今对比的写法更有说服力           │
│ ☐ [模式] 三段式枚举结构适合食材类主题       │
├──────────────────────────────────────────┤
│              [保存选中] [全部跳过]          │
└──────────────────────────────────────────┘
```

### 4.3 记忆编辑弹窗（替代当前的纯文本 textarea）

```
┌──────────────── 管理记忆 · 道家养生 ────────────────┐
│                                                     │
│ [风格偏好] [内容偏好] [需要避免] [成功模式] [全部]     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 口语化表达，像朋友聊天，不是播音腔             │     │
│ │ 来源：AI · 置信度：████░ 0.8 · 使用12次       │     │
│ │ 最后更新：2026-03-20                          │     │
│ │                        [编辑] [删除] [置顶]   │     │
│ └─────────────────────────────────────────────┘     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 结合《本草纲目》等古籍出处                     │     │
│ │ 来源：用户 · 置信度：█████ 1.0 · 使用8次      │     │
│ │ 最后更新：2026-03-25                          │     │
│ │                        [编辑] [删除] [置顶]   │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ + 手动添加新记忆                               │     │
│ │ 类型：[风格偏好 ▼]                             │     │
│ │ 内容：[________________________]               │     │
│ │                              [添加]            │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│                                        [完成]       │
└─────────────────────────────────────────────────────┘
```

---

## 五、实现分期

### Phase 1：数据结构升级（1-2 小时）

- [ ] 定义 `MemoryEntry` 类型
- [ ] 扩展 `Track` 接口添加 `memories: MemoryEntry[]`
- [ ] 在 `useTrackStore` 中添加 `addMemory`、`updateMemory`、`deleteMemory`
- [ ] 数据迁移：将旧的 `memory: string` 解析为 `MemoryEntry[]`
- [ ] 修改 Step 4 的 zod schema，让 AI 返回结构化 `memory_entries`

### Phase 2：智能合并 + 注入（2-3 小时）

- [ ] 实现 `mergeAIMemories` — 基于关键词重叠的去重合并
- [ ] 实现 `buildMemoryPrompt` — 按相关性评分选择 top-N 记忆注入
- [ ] 实现 `calculateScore` — confidence × recency × source × topicRelevance
- [ ] 修改 `prompt.ts` 中的 prompt 构建函数，使用新的记忆注入

### Phase 3：UI 升级（2-3 小时）

- [ ] 记忆卡片组件（按类型分组、显示 confidence 星级）
- [ ] 生成后记忆确认弹窗（勾选保存）
- [ ] 记忆编辑弹窗（替代当前 textarea）
- [ ] 侧边栏记忆面板改版
- [ ] 用户手动添加记忆

### Phase 4：衰减 + 进阶（1-2 小时）

- [ ] 实现 confidence 衰减机制
- [ ] 全局记忆（跨赛道通用偏好）
- [ ] 记忆导入/导出
- [ ] 记忆使用统计面板

### 未来（上 Supabase 后）

- [ ] 用 pgvector 做 embedding 语义相似度（替代关键词重叠）
- [ ] 记忆服务端存储，跨设备同步
- [ ] 基于用户群体的共享记忆（"养生赛道用户普遍偏好..."）

---

## 六、与竞品对比

| 能力 | 当前道心文案 | Mem0 | ChatGPT Memory | Jasper Brand Voice | 新方案 |
|---|---|---|---|---|---|
| 结构化存储 | ❌ 纯文本 | ✅ | ✅ | ✅ | ✅ |
| 自动提取 | ⚠️ 一句话 | ✅ | ✅ | ❌ 手动 | ✅ 多条结构化 |
| 去重合并 | ❌ | ✅ 向量 | ✅ | N/A | ✅ 关键词 → 向量 |
| 用户管理 | ⚠️ textarea | ❌ | ✅ 查看/删除 | ✅ 完整 | ✅ 完整 |
| 相关性检索 | ❌ 全量注入 | ✅ 向量搜索 | ✅ | N/A | ✅ 评分排序 |
| 置信度/权重 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 衰减机制 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 赛道隔离 | ✅ 按 track | N/A | ❌ 全局 | ✅ 按 brand | ✅ 按 track + 全局 |

---

## 七、技术要点

1. **中文分词**：使用 `Intl.Segmenter('zh-CN', { granularity: 'word' })` 做浏览器端中文分词，无需额外依赖
2. **Token 预算**：记忆注入控制在 ~500 token 以内，约 10-15 条规则
3. **迁移兼容**：旧的 `memory: string` 字段保留，首次打开时自动拆分为 `MemoryEntry[]`
4. **存储限制**：每个赛道最多 50 条记忆，超出时自动清理低 confidence 的
5. **LocalStorage 大小**：结构化记忆比纯文本大 ~3x，但 50 条约 5KB，远在限制内

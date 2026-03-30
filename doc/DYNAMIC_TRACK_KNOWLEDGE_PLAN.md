# 赛道知识库方案（混合模式）

> 内置知识库匹配 → 拆解为记忆种子 → 记忆系统统一管理 → 持续进化

## 核心架构

**知识库是记忆系统的种子，记忆系统是唯一的运行时知识源。**

```
赛道知识库（24个 .md 文档）
      ↓ 创建赛道时，一次性拆解转化
记忆系统（MemoryEntry[]）← 唯一的知识注入通道
      │
      ├── source: 'system'  — 来自知识库种子（初始 confidence 0.5-0.8）
      ├── source: 'ai'      — AI 每次生成后自动提取（初始 confidence 0.4）
      └── source: 'user'    — 用户手动添加（初始 confidence 0.9）
      │
      ↓
buildMemoryPrompt() → 按相关性 × 置信度 × 时效性评分，取 top-N 注入 prompt
```

**不存在两套并行系统。** 知识库文档只在创建赛道时使用一次，之后所有知识都通过记忆系统管理。

## 为什么这样设计

| 问题 | 解决方式 |
|---|---|
| Token 消耗 | 记忆系统的 top-N 机制天然控制注入量（最多注入15条最相关的） |
| 持续更新 | 知识库种子和用户记忆共存，用户偏好通过 confidence 提升逐渐覆盖通用知识 |
| 知识 vs 记忆冲突 | 同一个系统，高 confidence 的胜出 |
| 个性化 | 每个用户的赛道记忆随使用变得独特，不再是统一的知识库 |

## 用户新建赛道流程

```
用户填写赛道名「中医养生」+ 描述
                ↓
系统语义匹配内置知识库列表 → 找到最接近的「道家养生」
                ↓
展示给用户："推荐使用「道家养生」知识库，是否合适？"
                ↓
        ┌── 合适 → 绑定该知识库
        └── 不合适 → 后台 AI 生成新知识库（15-30秒）
                ↓
将知识库拆解为 MemoryEntry[] 写入赛道记忆
                ↓
赛道创建完成，可立即使用
                ↓
每次生成文案后，记忆系统自动积累 + 衰减，越用越精准
```

## 知识库拆解为记忆的规则

知识库文档的每个章节拆解为不同类型的 MemoryEntry：

| 知识库章节 | → MemoryEntry type | confidence | 说明 |
|---|---|---|---|
| 受众画像 | content | 0.6 | "目标受众：30+人群，关注人生意义..." |
| 爆款选题类型 | pattern | 0.6 | "反常识钩子在国学赛道完播率高" |
| 钩子模板 | pattern | 0.5 | "情感共鸣式开头适合修心赛道" |
| 内容角度 | content | 0.5 | "古今对比是国学赛道有效切入角度" |
| 常见错误 | avoid | 0.7 | "不要把经典简单翻译成白话文" |
| 合规红线 | avoid | 0.8 | "不可歪曲经典原意、不做医疗承诺" |
| 安全替换表 | avoid | 0.8 | "不说'治疗'，改说'调理/辅助'" |

**拆解原则：**
- 每条记忆是一句独立的、可复用的规则
- 合规类条目 confidence 最高（0.8），因为违规后果严重
- 通用知识类条目 confidence 中等（0.5-0.6），容易被用户偏好覆盖
- 每个赛道拆解出约 15-25 条种子记忆

## 记忆进化过程

```
第1次使用：
  system 种子记忆 15条（confidence 0.5-0.8）
  → buildMemoryPrompt 取最相关的注入 prompt
  → 输出质量已经不错（有赛道知识支撑）

第5次使用：
  system 种子记忆 15条 + AI 提取的用户偏好 8条
  → 用户偏好开始参与评分竞争
  → 与用户实际风格不符的种子记忆因不被命中，开始衰减

第20次使用：
  system 种子 12条（3条已衰减淘汰）+ AI 提取 18条 + 用户手动 5条
  → 记忆系统已经高度个性化
  → 高频命中的规律 confidence 接近 1.0
  → 输出质量明显优于初始状态
```

## 数据结构变更

### MemoryEntry.source 扩展

```typescript
export interface MemoryEntry {
  id: string;
  trackId: string;
  type: MemoryType;              // 'style' | 'content' | 'avoid' | 'pattern'
  content: string;
  source: 'ai' | 'user' | 'system';  // 新增 'system'
  confidence: number;            // 0.0 ~ 1.0
  hitCount: number;
  createdAt: number;
  updatedAt: number;
}
```

`system` 类型特点：
- 初始 confidence 0.5-0.8（比 AI 的 0.4 高，比用户的 0.9 低）
- 参与正常的衰减和评分
- 可以被用户删除或修改
- 在记忆管理 UI 中标记为「知识库」来源

### Track 扩展

```typescript
export interface Track {
  // ... 现有字段
  knowledgeId?: string;           // 绑定的内置知识库 ID（如 'guoxue'）
  knowledgeSeeded?: boolean;      // 是否已完成种子注入
}
```

### buildMemoryPrompt 评分调整

`source` 权重调整：

```typescript
const sourceWeight =
  memory.source === 'user' ? 1.3 :     // 用户手动 > 最高优先
  memory.source === 'system' ? 1.1 :    // 知识库种子 > 中等优先
  1.0;                                   // AI 提取 > 基础优先
```

## 内置知识库列表（24个）

| 大类 | 赛道 | 文件 |
|---|---|---|
| 传统文化 | 国学 | track-guoxue.md |
| | 道家养生 | track-daojia-yangsheng.md |
| | 修心 | track-xiuxin.md |
| | 佛学智慧 | track-foxue.md |
| | 易经风水 | track-yijing.md |
| 知识教育 | 职场成长 | track-zhichang.md |
| | 读书分享 | track-dushu.md |
| | 育儿教育 | track-yuer.md |
| | 英语学习 | track-yingyu.md |
| | 考试考证 | track-kaoshi.md |
| 生活方式 | 美食烹饪 | track-meishi.md |
| | 旅行攻略 | track-lvxing.md |
| | 家居好物 | track-jiaju.md |
| | 穿搭时尚 | track-chuanda.md |
| | 生活妙招 | track-shenghuo.md |
| 情感心理 | 情感关系 | track-qinggan.md |
| | 心理成长 | track-xinli.md |
| 商业财经 | 创业经验 | track-chuangye.md |
| | 理财投资 | track-licai.md |
| | 商业思维 | track-shangye.md |
| 健康运动 | 健身塑形 | track-jianshen.md |
| | 瑜伽冥想 | track-yujia.md |
| | 营养饮食 | track-yingyang.md |
| 科技数码 | 数码测评 | track-shuma.md |

另有 `cross-track-patterns.md` 跨赛道通用模式文档。

## 匹配策略

用户新建赛道时，调一次 AI（几百 token）做语义匹配：

```
System: 你是赛道分类助手。内置赛道列表：
[国学, 道家养生, 修心, 佛学智慧, 易经风水, 职场成长, ...]

用户新建赛道名称：「{name}」，描述：「{desc}」
从内置列表中选最接近的，返回 JSON：
{"match": "道家养生", "confidence": 0.85, "reason": "一句话原因"}
如果没有合适的（confidence < 0.5），返回 {"match": null}
```

## Prompt 注入策略

生成文案时的 system prompt 结构（只有一个知识注入通道）：

```
1. 通用方法论（道心四法、钩子公式、结构模型）  ← content-strategy.md 浓缩版
2. 赛道记忆（包含知识库种子 + AI提取 + 用户手动） ← buildMemoryPrompt()
3. 用户填写的 fewShot / banned / refAccounts      ← Track 字段
```

不再有单独的「赛道知识注入」环节，一切通过记忆系统。

## 知识库文档结构（模板）

每个内置知识库仍保持完整文档格式（便于人工审核和维护），但运行时只通过拆解后的记忆条目起作用：

```markdown
# {赛道名} 赛道知识库

## 1. 赛道概况
## 2. 受众画像
## 3. 爆款选题类型（与道心四法映射）
## 4. 钩子模板
## 5. 内容角度
## 6. 常见错误
## 7. 合规红线（含安全替换表）
## 8. AI Prompt 注入要点（≤500字，用于 AI 生成兜底时的 prompt）
```

第8节「AI Prompt 注入要点」仅在 AI 生成新知识库时使用（作为生成 prompt 的参考），不直接注入用户的生成流程。

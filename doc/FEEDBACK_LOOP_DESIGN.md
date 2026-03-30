# 反馈闭环系统设计方案

> 日期：2026-03-30
> 状态：已确认，待实施

## 1. 概述

### 1.1 问题

当前 daoxin 的数据流是单向的：生成文案 → 用户确认 → 存入历史 → 记忆更新（基于 AI 提取）。记忆系统的 confidence 完全依赖 AI 自我判断，与用户在平台上的真实表现脱节。

### 1.2 目标

建立完整的反馈闭环：**生成 → 发布 → 数据采集 → 记忆校准 → AI 分析 → 优化下次生成**。让真实的平台数据驱动记忆系统进化，而非仅依赖 AI 自我提取。

### 1.3 架构选型

**方案 A：独立模块 + 事件驱动**

反馈系统作为独立 Zustand store（`usePerformanceStore`），通过 subscribe 机制触发记忆校准和 AI 分析。与现有 `useTrackStore` 平行，不侵入现有代码。

```
PerformanceStore ──subscribe──→ calibrateMemories() ──→ TrackStore.boostMemory()
                 ──用户触发──→ /api/performance/analyze ──→ 洞察报告
```

---

## 2. 数据模型

### 2.1 新增类型

```typescript
// src/types/index.ts 新增

type Platform = 'douyin';

type DataSource = 'api' | 'screenshot';

type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor';

interface ContentPerformance {
  id: string;
  historyItemId: string;       // 关联 HistoryItem.id
  trackId: string;
  platform: Platform;
  publishedAt: number;         // 发布时间

  // 互动指标（必填）
  views: number;               // 播放量
  likes: number;               // 点赞
  comments: number;            // 评论数
  shares: number;              // 转发
  saves: number;               // 收藏
  followers: number;           // 涨粉

  // 高级指标（可选，平台提供时填入）
  completionRate?: number;     // 完播率 0-100
  avgWatchTime?: number;       // 平均观看秒数

  // 转化指标（可选）
  sales?: number;              // 销售量
  revenue?: number;            // 销售额
  clickRate?: number;          // 链接点击率 0-100

  // 元数据
  strategy: StrategyType;      // 生成时使用的策略
  source: DataSource;
  recordedAt: number;          // 录入时间
  updatedAt: number;           // 最后更新时间（允许多次更新）
  calibratedAt?: number;       // 校准执行时间（防止重复校准）
}

interface TrackPerformanceSummary {
  trackId: string;
  totalPosts: number;
  avgViews: number;
  avgLikes: number;
  avgSaves: number;
  strategyBreakdown: Record<StrategyType, {
    count: number;
    avgViews: number;
    avgLikes: number;
    avgSaves: number;
  }>;
  topPerformers: string[];     // performance IDs, top 20%
  bottomPerformers: string[];  // bottom 20%
}
```

### 2.2 现有类型改动

```typescript
// HistoryItem 新增字段
interface HistoryItem {
  // ...现有字段不变
  usedMemoryIds?: string[];    // 生成时注入 prompt 的记忆 ID 列表
}
```

`buildMemoryPrompt` 函数签名调整：除返回 prompt 文本外，额外返回选中的记忆 ID 列表。

---

## 3. PerformanceStore

### 3.1 Store 结构

```typescript
// src/store/usePerformanceStore.ts

interface PerformanceStore {
  performances: ContentPerformance[];

  // CRUD
  addPerformance: (data: Omit<ContentPerformance, 'id' | 'recordedAt' | 'updatedAt'>) => void;
  updatePerformance: (id: string, metrics: Partial<ContentPerformance>) => void;
  deletePerformance: (id: string) => void;

  // 查询
  getByHistoryItem: (historyItemId: string) => ContentPerformance | undefined;
  getByTrack: (trackId: string) => ContentPerformance[];

  // 统计
  getTrackSummary: (trackId: string) => TrackPerformanceSummary;
  getPerformanceLevel: (id: string) => PerformanceLevel;
}
```

### 3.2 持久化

- Key: `daoxin_performance`（独立于现有 `daoxin_v1`）
- 使用 Zustand persist middleware，与现有 store 一致

### 3.3 排名算法（PerformanceLevel）

基于同赛道内的综合得分排名：

```
综合得分 = views * 0.3 + likes * 0.25 + saves * 0.2 + comments * 0.1 + shares * 0.1 + followers * 0.05
```

排名分档：
- top 20% → excellent
- 20%-50% → good
- 50%-80% → average
- bottom 20% → poor

---

## 4. 数据采集

### 4.1 路径一：截图 AI 识别（第一阶段，优先实现）

**流程**：用户上传抖音数据截图 → Claude Vision 提取数字 → 用户确认 → 写入 store

**API Route**: `POST /api/performance/parse-screenshot`

- 输入：Base64 图片
- 调用 Claude Vision API，prompt 指示从截图中提取：播放量、点赞、评论、分享、收藏、涨粉等
- 输出：结构化 JSON（与 ContentPerformance 的指标字段对齐）
- 用户可在确认前手动修正识别错误

**优势**：零外部依赖，开发成本低，用户截图即可完成。

### 4.2 路径二：抖音 API 对接（第二阶段）

**流程**：用户 OAuth 授权 → 获取 token → 拉取视频列表 → 匹配历史文案 → 自动写入

**新增 API Routes**:

```
POST /api/douyin/auth       — 发起 OAuth 授权
GET  /api/douyin/callback   — 接收回调，存储 token
POST /api/douyin/sync       — 拉取视频数据，匹配历史记录
```

**新增 Store**: `useDouyinStore`
- 存储：accessToken, openId, expiresAt
- 持久化 key: `daoxin_douyin`

**匹配逻辑**：
- 拉取用户抖音视频列表
- 视频 title 与 HistoryItem 的 `result.titles[]` 做相似度匹配（复用 `calculateSimilarity`）
- 匹配阈值 > 0.6 时自动关联

**抖音开放平台可获取数据**：
- play_count, digg_count（点赞）, comment_count, share_count, forward_count
- 完播率和收藏需要更高级权限

**注意**：抖音开发者账号审批周期约 2-4 周，不阻塞第一阶段。

---

## 5. 记忆校准机制

### 5.1 触发时机

每次 `addPerformance` 或 `updatePerformance` 时自动触发。同一条 performance 只校准一次（通过 `calibratedAt` 字段防重）。

### 5.2 校准算法

```typescript
// src/lib/calibration.ts

function calibrateMemories(
  performance: ContentPerformance,
  level: PerformanceLevel,
  usedMemoryIds: string[],
  trackMemories: MemoryEntry[]
): { memoryId: string; delta: number }[]
```

**校准规则**：

| PerformanceLevel | confidence 调整 |
|-----------------|----------------|
| excellent (top 20%) | +0.15 |
| good (20-50%) | +0.05 |
| average (50-80%) | 0（不调整） |
| poor (bottom 20%) | -0.10 |

### 5.3 安全边界

- confidence 范围：`[0.05, 1.0]`，低于 0.05 自动删除
- `source: 'user'` 的记忆**不参与**自动校准（用户手动规则不被数据覆盖）
- 单条记忆单次最大调整幅度 ±0.15
- 同一条 performance 只触发一次校准

### 5.4 执行流程

```
performance 写入
  → getPerformanceLevel(id)
  → 从 HistoryItem 获取 usedMemoryIds
  → calibrateMemories() 计算 delta 列表
  → 逐条调用 TrackStore.boostMemory(trackId, memoryId, delta)
  → 标记 performance.calibratedAt
```

---

## 6. AI 深层分析

### 6.1 触发条件

- 赛道内 ≥ 5 条表现数据时，解锁"生成分析报告"按钮
- 用户手动触发（不自动生成，避免消耗 token）

### 6.2 API Route

`POST /api/performance/analyze`

### 6.3 AI 输入

```
1. TrackPerformanceSummary（统计汇总）
2. Top 3 表现最好的文案 + 其使用的策略和记忆
3. Bottom 3 表现最差的文案 + 其使用的策略和记忆
4. 当前赛道的记忆列表
5. 赛道画像（TrackProfile）
```

### 6.4 AI 输出结构

```typescript
interface PerformanceAnalysis {
  // 总体洞察
  overview: string;

  // 策略推荐
  strategyRecommendation: {
    best: StrategyType;
    reason: string;
    avoid?: StrategyType;
    avoidReason?: string;
  };

  // 内容建议（3条）
  suggestions: {
    action: string;        // 具体建议
    evidence: string;      // 数据依据
  }[];

  // 记忆调整建议
  memoryActions: {
    action: 'add' | 'remove' | 'modify';
    memoryId?: string;     // remove/modify 时指定
    type?: MemoryType;     // add 时指定
    content: string;
    reason: string;
  }[];
}
```

### 6.5 用户确认机制

- `overview` + `strategyRecommendation` + `suggestions`：直接展示
- `memoryActions`：逐条展示，用户选择"采纳"或"忽略"
- 采纳后执行对应的 memory CRUD 操作

AI 是建议者，用户有最终控制权。

---

## 7. UI 设计

### 7.1 不新增独立导航页面

所有功能嵌入现有页面：
- **录入** → 文档页的 ResultCard 上操作
- **查看/分析** → 赛道详情页新增 tab

### 7.2 录入入口

文档页 `ResultCard` 新增按钮：

```
ResultCard
  └── [复制] [删除]
  └── [📊 录入数据] → PerformanceModal
```

### 7.3 PerformanceModal（数据录入弹窗）

两个 tab：
- **截图识别**（第一阶段）：
  - 拖入/选择截图
  - "识别中..." loading
  - 预览提取的数字（可编辑修正）
  - 确认保存
- **抖音同步**（第二阶段）：
  - 授权状态显示
  - 同步按钮

### 7.4 数据展示

已录入数据的 ResultCard 显示简要指标条：

```
▶ 12.3w  👍 8,521  💬 342  ⭐ 1,205  ↗ 256
```

点击展开详情 + PerformanceLevel 标签（excellent/good/average/poor）。

### 7.5 赛道分析面板

位置：`TrackDetailPanel`，新增"数据分析" tab（与"记忆管理"并列）。

内容：
- **统计概览**：总发布数、平均指标
- **策略对比**：四种策略的效果柱状图
- **AI 分析**：按钮（≥5 条数据可用）+ 报告展示区
- **记忆建议**：采纳/忽略操作按钮

---

## 8. 新增文件清单

```
src/types/index.ts                               — 新增 Performance 相关类型
src/store/usePerformanceStore.ts                  — 表现数据 store
src/lib/calibration.ts                            — 记忆校准算法
src/app/api/performance/parse-screenshot/route.ts — 截图识别 API
src/app/api/performance/analyze/route.ts          — AI 分析 API
src/components/performance/PerformanceModal.tsx    — 数据录入弹窗
src/components/performance/PerformanceBadge.tsx    — 指标条组件
src/components/performance/AnalysisPanel.tsx       — 分析面板
```

## 9. 现有文件改动

```
src/types/index.ts          — HistoryItem 新增 usedMemoryIds 字段
src/lib/memory.ts           — buildMemoryPrompt 额外返回记忆 ID 列表
src/components/generation/StepCards/StepContainer.tsx — 保存 usedMemoryIds 到 HistoryItem
src/components/documents/DocumentsPage.tsx        — ResultCard 新增录入按钮
src/components/track/TrackDetailPanel.tsx          — 新增数据分析 tab
```

## 10. 实施阶段

### 第一阶段（MVP）
1. 数据模型 + PerformanceStore
2. 截图识别 API + PerformanceModal
3. HistoryItem 记录 usedMemoryIds
4. 记忆校准机制（calibration.ts + store 集成）
5. ResultCard 数据展示（PerformanceBadge）

### 第二阶段
6. AI 分析 API + AnalysisPanel
7. 赛道分析面板（统计 + 策略对比 + 报告）

### 第三阶段
8. 抖音 API 对接（OAuth + 自动同步）
9. useDouyinStore

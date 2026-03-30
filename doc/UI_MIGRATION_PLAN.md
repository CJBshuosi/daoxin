# 道心文案 → PenTip UI 迁移实现计划

> 将现有中式水墨风格的单页应用迁移到 Figma 导出的复古打字机主题多页面应用
> 保留 Next.js + Tailwind 技术栈，业务逻辑（store/API/prompt）完全不变

## 一、总体架构变化

### 现有架构
```
单页面 (page.tsx)
├── Header（顶部标题栏）
├── Sidebar（赛道列表 + 操作按钮）
└── Main
    ├── InputZone（输入框 + 对标账号）
    ├── StepContainer（Step 1-5 生成流程）
    └── ResultCard[]（历史记录列表）
```

### 新架构
```
Layout (全局布局)
├── SidebarMinimal（左侧图标导航栏，56px 宽）
├── TopBar（顶部品牌 + 模型选择器）
└── PageContent（按导航切换）
    ├── /workspace   → 工作台（CRT屏幕 + 键盘）
    ├── /knowledge   → 知识库浏览
    ├── /tracks      → 赛道管理
    ├── /documents   → 文稿管理
    └── /settings    → 设置
```

### 路由方案
使用 Next.js App Router，但不做真正的页面路由（避免页面刷新丢失状态）。
采用**客户端 tab 切换**：一个 `activePage` state 控制显示哪个面板，URL 不变。
原因：zustand store 是内存态，跨页面需要 persist（已有），但生成流程中途切页面会丢失 StepContainer 状态。

## 二、分阶段实施

### 阶段 A：基础骨架搭建（布局 + 导航 + 样式迁移）

#### A1. 引入新设计的样式系统
- [ ] 将 Figma 导出的 `App.css` 核心样式提取到 `src/styles/typewriter.css`
- [ ] 引入字体：`Courier Prime`（等宽）、`Playfair Display`（衬线标题）
- [ ] 定义新的 CSS 变量 / Tailwind 扩展：
  ```
  --bg-base: #F5F1E8        (页面背景)
  --bg-panel: #E3DCCB        (面板背景，如CRT外壳)
  --bg-screen: #FCF9F0       (CRT屏幕背景)
  --accent: #E85D3B          (强调色，橙红)
  --accent-dark: #D84A2A     (强调色深)
  --accent-shadow: #A83A20   (强调色阴影)
  --text-primary: #2A2522    (主文字)
  --text-secondary: #3A3530  (次文字)
  --text-muted: #8C8276      (弱文字)
  --text-placeholder: #C8BFA9(占位符)
  --border-light: #C8BFA9    (浅边框)
  --border-panel: #BAAF99    (面板边框)
  --surface-key: #F5EFE1     (键帽颜色)
  ```
- [ ] 保留 Tailwind 作为辅助，新组件优先使用新的 CSS class

#### A2. 创建新的全局布局
- [ ] 新建 `src/components/layout/AppLayout.tsx`
  - 包含 SidebarMinimal + TopBar + 内容区
  - 管理 `activePage` state
- [ ] 新建 `src/components/layout/SidebarMinimal.tsx`
  - 图标导航：工作台(Grid) / 知识库(BookOpen) / 赛道管理(TrendingUp) / 文稿管理(FileText)
  - 底部：设置(Settings) / 用户头像(User)
  - hover tooltip 效果
  - active 状态左侧橙色竖线指示器
- [ ] 新建 `src/components/layout/TopBar.tsx`
  - 左侧：品牌 logo + "道心文案" 文字（保留中文品牌名，替换 PenTip）
  - 右侧：模型选择器下拉菜单
- [ ] 修改 `src/app/page.tsx`
  - 替换现有布局为 AppLayout
  - 根据 activePage 渲染不同内容面板

#### A3. 删除旧布局组件
- [ ] 标记弃用：`Header.tsx`、`Sidebar.tsx`（旧版）
- [ ] 确认新布局功能完整后删除

---

### 阶段 B：工作台页面（CRT屏幕 + 键盘 + 生成流程）

这是核心页面，工作量最大。

#### B1. CRT 屏幕容器
- [ ] 新建 `src/components/workspace/CRTMonitor.tsx`
  - 外壳：monitor-unit 样式（圆角面板 + 底部厚边框 + 阴影）
  - 内屏：screen-glass 样式（扫描线效果）
  - **高度自适应**：默认 `min-height: 280px`，生成时 `flex: 1` 填满可用空间
  - 内部内容可滚动（overflow-y: auto）

#### B2. CRT 内部 — 输入态
- [ ] 新建 `src/components/workspace/CRTInput.tsx`
  - 顶部：赛道选择器（下拉，从 store 读取 tracks）
  - 中部：旋转提示语（PROMPTS 数组，淡入淡出）
  - 底部：打字区域
    - 隐藏 input + 可见文字 + 闪烁光标
    - 支持中文输入法（compositionstart/update/end）
  - 回车键触发生成（调用 onGenerate）
  - 参考 Figma 导出的输入逻辑，适配现有的 `prompt` state

#### B3. CRT 内部 — 生成态
- [ ] 复用现有 `StepContainer.tsx` 及其子组件
  - Step1TopicConfirm
  - Step2StrategySelect
  - Step3TopicSelect
  - Step5PolishConfirm
- [ ] 样式适配：
  - 将各 Step 组件的 Tailwind class 调整为打字机主题配色
  - 金色(gold) → 橙红(#E85D3B)
  - 背景色 → CRT 屏幕色(#FCF9F0)
  - 保留功能不变，只换皮肤
- [ ] EmotionCurve 组件：SVG 颜色适配新主题

#### B4. 键盘组件
- [ ] 新建 `src/components/workspace/Keyboard.tsx`
  - 从 Figma 导出的 App.tsx 提取键盘 JSX 和按键映射逻辑
  - 按键高亮响应（keydown/keyup 事件）
  - Props: `visible: boolean`（控制显示/隐藏）
  - 隐藏时有平滑过渡动画（translateY + opacity）

#### B5. 工作台页面组装
- [ ] 新建 `src/components/workspace/WorkspacePage.tsx`
  ```
  状态机：
  - idle: CRT(输入态) + 键盘(显示)
  - generating: CRT(生成态, 放大) + 键盘(隐藏)
  - done: CRT(结果态, 放大) + 键盘(隐藏)，确认后回到 idle
  ```
  - 用户在 CRT 输入主题 → 按回车
  - 键盘 slideDown 隐藏，CRT 高度 transition 放大
  - StepContainer 在 CRT 内渲染 Step 1-5
  - 用户确认文案 → 保存历史 → CRT 恢复输入态 → 键盘 slideUp 显示

#### B6. 画像弹窗触发
- [ ] 保留 TrackProfileModal 逻辑
- [ ] 首次生成时弹出画像收集（与现有逻辑一致）

---

### 阶段 C：赛道管理页面

#### C1. 赛道列表视图
- [ ] 新建 `src/components/tracks/TracksPage.tsx`
  - 网格/列表展示所有赛道
  - 每个赛道卡片显示：名称、颜色标识、描述、生成次数、记忆条目数
  - 右上角"新增赛道"按钮
  - 搜索/筛选（可选，赛道多时有用）

#### C2. 赛道详情视图
- [ ] 新建 `src/components/tracks/TrackDetailPanel.tsx`
  - 点击赛道卡片 → 右侧展开详情面板（或全屏切换）
  - Tab 切换：
    - **概览**：名称、描述、颜色、对标账号、禁忌词、Few-shot
    - **记忆系统**：复用现有 MemoryDisplay 组件（样式适配）
    - **画像**：展示/编辑 TrackProfile（目标受众/人设/变现/目标）
  - 编辑功能复用 TrackModal 逻辑，但改为内嵌表单而非弹窗
  - 删除赛道按钮（带确认）

#### C3. 迁移现有组件
- [ ] `MemoryModal.tsx` → 改为内嵌组件 `MemoryPanel.tsx`（不再是弹窗）
- [ ] `MemoryDisplay.tsx` → 样式适配新主题
- [ ] `TrackModal.tsx` → 保留用于"新增赛道"弹窗，编辑改为内嵌

---

### 阶段 D：文稿管理页面

#### D1. 历史记录列表
- [ ] 新建 `src/components/documents/DocumentsPage.tsx`
  - 顶部：赛道过滤器（下拉或标签页，"全部" + 各赛道名）
  - 列表展示历史记录，按时间倒序
  - 每条显示：赛道标签、主题、生成时间、展开/收起
  - 复用现有 `ResultCard` 组件（样式适配）

#### D2. 功能保留
- [ ] 展开查看完整结果（文案/标题/情绪曲线/拍摄指导）
- [ ] 复制正文/标题
- [ ] 删除记录
- [ ] 重新生成（跳转到工作台，填入主题，开始生成）

---

### 阶段 E：知识库浏览页面

#### E1. 知识库列表
- [ ] 新建 `src/components/knowledge/KnowledgePage.tsx`
  - 按分类展示 24 个内置知识库
  - 分类标签：传统文化 / 生活方式 / 商业职场 / 情感心理 / ...
  - 每个知识库卡片：名称、分类、描述、种子数量

#### E2. 知识库详情
- [ ] 点击卡片展开详情
  - 显示该知识库的所有 seed 条目
  - 按类型分组（content / pattern / style / avoid）
  - 只读浏览，不可编辑（这是内置数据）
  - 显示哪些赛道正在使用该知识库

---

### 阶段 F：设置页面 + 模型切换

#### F1. 模型切换功能
- [ ] 新建 `src/store/useSettingsStore.ts`
  ```typescript
  interface SettingsStore {
    model: 'claude' | 'deepseek' | 'gpt4';
    setModel: (model: string) => void;
  }
  ```
  - persist 到 localStorage
- [ ] 修改 `src/app/api/generate/route.ts`
  - 接收 `model` 参数
  - 根据参数选择不同的 AI provider：
    ```
    claude   → anthropic('claude-sonnet-4-20250514')
    deepseek → 需要添加 @ai-sdk/openai-compatible 或 deepseek provider
    gpt4     → 需要添加 @ai-sdk/openai
    ```
  - 各模型的 schema/prompt 可能需要微调（DeepSeek 对结构化输出支持较弱）
- [ ] 修改 `src/app/api/match-track/route.ts` 和 `src/app/api/generate-knowledge/route.ts`
  - 同样支持模型切换

#### F2. 设置页面 UI
- [ ] 新建 `src/components/settings/SettingsPage.tsx`
  - 模型选择（单选）
  - 每个模型显示：名称、简介、优缺点提示
  - API Key 配置（如果需要用户自带 key）
  - 未来可扩展：语言设置、主题切换等

#### F3. TopBar 模型选择器
- [ ] TopBar 右侧的模型下拉菜单读取 settingsStore
- [ ] 切换后立即生效，下次生成使用新模型

---

## 三、样式迁移细节

### 配色映射
```
旧 → 新
--gold (#b8860b)        → --accent (#E85D3B)
--bg-paper (#faf7f1)    → --bg-screen (#FCF9F0)
--bg-paper2             → --bg-base (#F5F1E8)
--bg-ink (#2a2522)      → --text-primary (#2A2522)  (基本一致)
--border-paper3         → --border-light (#C8BFA9)
```

### 字体映射
```
旧 → 新
font-serif (宋体感)     → 'Playfair Display', serif（标题/品牌）
font-sans (默认)        → 'Courier Prime', monospace（正文/UI）
```

### 组件样式适配清单
- [ ] Step1TopicConfirm — border-gold → border-accent, bg-gold → bg-accent
- [ ] Step2StrategySelect — 同上
- [ ] Step3TopicSelect — 同上
- [ ] Step5PolishConfirm — 同上
- [ ] EmotionCurve — SVG stroke/fill 颜色替换
- [ ] ResultCard — 同上
- [ ] TrackModal — 弹窗样式适配
- [ ] TrackProfileModal — 弹窗样式适配
- [ ] MemoryDisplay — 标签颜色适配

---

## 四、文件变更清单

### 新增文件
```
src/styles/typewriter.css              — 打字机主题核心样式
src/components/layout/AppLayout.tsx    — 全局布局
src/components/layout/SidebarMinimal.tsx — 左侧图标导航
src/components/layout/TopBar.tsx       — 顶部栏
src/components/workspace/WorkspacePage.tsx  — 工作台页面
src/components/workspace/CRTMonitor.tsx     — CRT 显示器容器
src/components/workspace/CRTInput.tsx       — CRT 输入态
src/components/workspace/Keyboard.tsx       — 键盘组件
src/components/tracks/TracksPage.tsx        — 赛道管理页面
src/components/tracks/TrackDetailPanel.tsx  — 赛道详情面板
src/components/tracks/MemoryPanel.tsx       — 记忆系统面板（非弹窗）
src/components/documents/DocumentsPage.tsx  — 文稿管理页面
src/components/knowledge/KnowledgePage.tsx  — 知识库浏览页面
src/components/settings/SettingsPage.tsx    — 设置页面
src/store/useSettingsStore.ts              — 设置 store（模型选择等）
```

### 修改文件
```
src/app/page.tsx           — 替换为 AppLayout 包裹
src/app/layout.tsx         — 引入新字体和 typewriter.css
src/app/api/generate/route.ts — 支持模型切换参数
src/app/api/match-track/route.ts — 同上
src/app/api/generate-knowledge/route.ts — 同上
src/components/generation/StepCards/*.tsx — 样式适配新主题
src/components/generation/EmotionCurve.tsx — 颜色适配
src/components/generation/ResultCard.tsx — 样式适配
```

### 可删除文件（迁移完成后）
```
src/components/layout/Header.tsx    — 被 TopBar 替代
src/components/layout/Sidebar.tsx   — 被 SidebarMinimal 替代
src/components/generation/InputZone.tsx — 被 CRTInput 替代
src/components/history/HistoryModal.tsx — 被 DocumentsPage 替代
src/components/memory/MemoryModal.tsx   — 被 MemoryPanel 替代
src/figma-export/                       — 迁移完成后可删除
```

---

## 五、实施顺序建议

```
阶段 A（骨架）→ 阶段 B（工作台）→ 阶段 C（赛道管理）→ 阶段 D（文稿管理）→ 阶段 E（知识库）→ 阶段 F（设置+模型切换）
```

每个阶段完成后都可以独立测试，不会破坏其他功能。
阶段 A+B 完成后核心功能即可使用，C-F 是增量页面。

预计总共新增 ~15 个文件，修改 ~10 个文件。

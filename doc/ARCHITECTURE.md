# 道心文案 · Next.js 架构方案

## 技术栈
- Next.js 15 (App Router) + TypeScript + Tailwind CSS + Shadcn UI
- Zustand (状态管理，persist 中间件同步 localStorage)
- Vercel AI SDK + @ai-sdk/anthropic (流式 AI 响应)
- Supabase PostgreSQL (Phase 2，暂用 localStorage)

## 项目结构
```
daoxin/
├── public-legacy/          # 原始三文件（备份参考）
├── doc/                    # 文档
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 根布局（字体、全局样式）
│   │   ├── page.tsx        # 主页面
│   │   ├── globals.css     # CSS 变量 + Tailwind
│   │   └── api/
│   │       └── generate/
│   │           └── route.ts  # POST: 代理 Anthropic API
│   ├── components/
│   │   ├── layout/         # Header, Sidebar
│   │   ├── track/          # TrackList, TrackItem, TrackModal, ColorPicker
│   │   ├── memory/         # MemoryDisplay, MemoryModal
│   │   ├── generation/     # InputZone, OutputArea, ResultCard, StepCards/
│   │   └── ui/             # Shadcn UI 组件
│   ├── lib/
│   │   ├── prompt.ts       # buildSystemPrompt()
│   │   ├── constants.ts    # COLORS, 默认赛道
│   │   └── utils.ts        # 工具函数
│   ├── store/
│   │   └── useTrackStore.ts  # Zustand store
│   └── types/
│       └── index.ts        # TypeScript 类型
├── .env.local              # ANTHROPIC_API_KEY
└── package.json
```

## 构建顺序
1. 脚手架 + 主题移植（字体、CSS 变量、Tailwind 配置）
2. Zustand Store（从 app.js 迁移状态逻辑，persist → localStorage）
3. 布局组件（Header, Sidebar, 主区域）
4. 赛道管理（TrackModal, ColorPicker, MemoryModal）
5. API Route + 生成逻辑（代理 Anthropic API）
6. 多步生成流程（Step 1-4 卡片）
7. Supabase 集成（后续）

## 关键决策
- API Key 从前端输入 → 服务端 .env.local
- localStorage 向后兼容（key: daoxin_v1）
- 先不做流式 JSON 解析，等完整响应后 parse
- 原始文件移到 public-legacy/ 避免 Next.js 冲突

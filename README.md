<div align="center">

# 道心文案

**AI 驱动的短视频文案创作平台**

基于「道心四法」策略体系，为短视频创作者提供从选题分析到完整文案的一站式 AI 创作工具。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

</div>

---

## 功能特性

**AI 创作流水线**
- 选题分析 → 策略推荐 → 多角度选题 → 完整文案 → 智能润色
- 道心四法策略：明道·洞见 / 动心·共鸣 / 启思·价值 / 破局·创意
- 自动生成情绪曲线、拍摄指导、BGM 推荐

**赛道管理**
- 自定义赛道（主题方向），每条赛道独立记忆体系
- AI 自动匹配内置知识库或生成专属知识种子
- 赛道画像配置：目标受众、人设、变现方向、内容目标

**记忆系统**
- 四类记忆：风格偏好 / 内容规律 / 避免事项 / 成功模式
- AI 每次创作自动提取并沉淀规律
- 置信度衰减 + 数据反馈强化机制

**数据表现追踪**
- 截图识别自动提取播放、点赞、收藏等数据
- AI 分析内容表现，优化创作策略
- 数据驱动记忆校准

**多模型支持**
- 通义千问 Qwen Max / Claude Sonnet / Gemini 2.5 Pro / GPT-4o
- 用户自配 API Key，按需选择模型

---

## 系统架构

```mermaid
graph TB
    subgraph Client["🖥️ 前端 (Next.js App Router)"]
        UI["页面组件"]
        Store["Zustand 状态管理"]
        Settings["用户设置<br/>(模型选择 + API Key)"]
    end

    subgraph API["⚡ API 路由 (Serverless Functions)"]
        Guard["API Guard<br/>认证 · 限流 · 配额"]
        Generate["/api/generate<br/>文案生成"]
        Match["/api/match-track<br/>赛道匹配"]
        Knowledge["/api/generate-knowledge<br/>知识种子"]
        Analyze["/api/performance/analyze<br/>数据分析"]
        Screenshot["/api/performance/parse-screenshot<br/>截图识别"]
    end

    subgraph AI["🤖 AI 模型"]
        Qwen["通义千问<br/>Qwen Max"]
        Claude["Claude<br/>Sonnet"]
        Gemini["Gemini<br/>2.5 Pro"]
        GPT["GPT-4o"]
    end

    subgraph Supabase["🗄️ Supabase"]
        Auth["Auth<br/>邮箱 OTP"]
        DB["PostgreSQL"]
        RLS["Row Level Security"]
    end

    subgraph Tables["📊 数据表"]
        T1["profiles"]
        T2["tracks"]
        T3["memories"]
        T4["history_items"]
        T5["performances"]
        T6["subscriptions"]
    end

    UI --> Store
    UI --> Settings
    Store -- "Supabase CRUD" --> DB
    UI -- "fetch + x-api-key" --> Guard
    Guard --> Generate & Match & Knowledge & Analyze & Screenshot
    Generate & Match & Knowledge & Analyze & Screenshot -- "用户自有 Key" --> AI
    Auth -- "JWT" --> Guard
    DB --> RLS
    RLS --> Tables

    style Client fill:#FCF9F0,stroke:#C8BFA9,color:#2A2522
    style API fill:#FFF5F2,stroke:#E85D3B,color:#2A2522
    style AI fill:#F0F4FF,stroke:#6366F1,color:#2A2522
    style Supabase fill:#F0FDF4,stroke:#3ECF8E,color:#2A2522
    style Tables fill:#F0FDF4,stroke:#3ECF8E,color:#2A2522
```

```mermaid
graph LR
    subgraph Flow["📝 AI 创作流水线"]
        S1["1️⃣ 选题分析<br/>潜力评估 + 策略推荐"] --> S2["2️⃣ 策略选择<br/>道心四法"]
        S2 --> S3["3️⃣ 选题生成<br/>3个角度 + 钩子"]
        S3 --> S4["4️⃣ 完整文案<br/>正文 + 标题 + 拍摄指导"]
        S4 --> S5["5️⃣ 智能润色<br/>按需优化"]
    end

    subgraph Memory["🧠 记忆系统"]
        M1["风格偏好<br/>style"]
        M2["内容规律<br/>content"]
        M3["避免事项<br/>avoid"]
        M4["成功模式<br/>pattern"]
    end

    S4 -- "提取规律" --> Memory
    Memory -- "指导创作" --> S1

    style Flow fill:#FCF9F0,stroke:#C8BFA9,color:#2A2522
    style Memory fill:#FFF5F2,stroke:#E85D3B,color:#2A2522
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 状态管理 | Zustand v5 |
| 数据库 | Supabase (PostgreSQL + RLS) |
| 认证 | Supabase Auth (邮箱 OTP) |
| AI SDK | Vercel AI SDK |
| 部署 | Vercel (Serverless) |
| 样式 | CSS Variables + Tailwind |

---

## 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/CJBshuosi/daoxin.git
cd daoxin
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key
```

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行：

```
supabase/migrations/001_initial_schema.sql
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

---

## 项目结构

```
src/
├── app/
│   ├── api/                  # API 路由 (Serverless Functions)
│   │   ├── generate/         # AI 文案生成
│   │   ├── match-track/      # 赛道匹配
│   │   ├── generate-knowledge/ # 知识种子生成
│   │   ├── performance/      # 数据分析 + 截图识别
│   │   └── search/           # 联网搜索
│   ├── login/                # 邮箱 OTP 登录
│   └── page.tsx              # 主页面
├── components/
│   ├── generation/           # 创作流水线 UI
│   ├── track/                # 赛道管理
│   ├── knowledge/            # 知识库
│   ├── performance/          # 数据表现
│   ├── memory/               # 记忆管理
│   ├── settings/             # 设置（模型 + API Key）
│   └── layout/               # 布局组件
├── store/                    # Zustand 状态管理
├── lib/                      # 工具库（Prompt、模型、Supabase）
└── types/                    # TypeScript 类型定义
```

---

## 部署

```bash
npm i -g vercel
vercel --prod
```

在 Vercel 项目 Settings → Environment Variables 中添加 Supabase 环境变量。

---

## License

MIT

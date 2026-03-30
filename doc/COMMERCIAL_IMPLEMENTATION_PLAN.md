# 道心文案 · 商用上线实施方案

> 日期：2026-03-30
> 策略：方案 A（全量迁移，一步到位）
> 第一版认证：手机号登录，微信登录后续接入

---

## 一、现状与目标

### 现状

| 维度 | 当前状态 |
|------|---------|
| 数据存储 | 浏览器 localStorage（3 个 key：daoxin_v1 / daoxin_settings / daoxin_performance） |
| 用户体系 | 无，单机单用户 |
| API 安全 | 零防护，所有路由公开，无限流、无校验 |
| 多端同步 | 不支持，清缓存即丢失 |

### 目标

多用户 SaaS 产品：用户注册登录 → 数据云端持久化 → API 按用户鉴权限流 → 付费配额控制。

---

## 二、技术选型（已确认）

| 组件 | 方案 | 理由 |
|------|------|------|
| 后端 | Supabase | Auth + PostgreSQL + RLS 一站式，无需自建后端 |
| 认证 | Supabase Auth（手机号 OTP） | 原生支持，零额外开发。微信登录后续通过 Custom Provider 接入 |
| 数据库 | Supabase PostgreSQL | 支持 pgvector，后续记忆向量化零迁移成本 |
| 限流 | Supabase Edge Function + 内存计数 / Upstash Redis | 按用户 rate limit |
| 校验 | Zod（已有） | 所有 API Route 入口统一校验 |
| 向量检索 | pgvector + Qwen text-embedding-v3 | P1 阶段，建表时预留 vector(1024) 列 |

---

## 三、数据库 Schema

### 3.1 表结构

```sql
-- 启用 pgvector 扩展（建表时一步到位，P1 记忆向量化直接可用）
create extension if not exists vector;

-- =====================
-- 用户表（Supabase Auth 自动创建 auth.users，这里存业务扩展字段）
-- =====================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  nickname text,
  avatar_url text,
  plan text not null default 'free',        -- free / pro / enterprise
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- 赛道表
-- =====================
create table public.tracks (
  id text primary key,                       -- 沿用前端生成的 ID 格式
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#8b5cf6',
  banned text not null default '',           -- 禁忌词，逗号分隔
  few_shot text not null default '',         -- 爆款参考文案
  ref_accounts text[] not null default '{}', -- 对标账号
  knowledge_id text,                         -- 绑定的内置知识库 ID
  knowledge_seeded boolean not null default false,
  -- 画像
  profile_completed boolean not null default false,
  target_audience text not null default '',
  persona text not null default '',
  product text not null default '',
  content_goal text not null default '',
  --
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tracks_user on public.tracks(user_id);

-- =====================
-- 记忆表（预留 embedding 列，P1 启用）
-- =====================
create table public.memories (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('style', 'content', 'avoid', 'pattern')),
  content text not null,
  source text not null check (source in ('ai', 'user', 'system')),
  confidence real not null default 0.4,
  hit_count integer not null default 0,
  embedding vector(1024),                    -- P1 启用，当前留空
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_memories_track on public.memories(track_id);
create index idx_memories_user on public.memories(user_id);

-- =====================
-- 历史记录表
-- =====================
create table public.history_items (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_name text not null,
  track_color text not null,
  prompt text not null,
  result jsonb not null,                     -- GenerationResult 完整 JSON
  strategy text,
  used_memory_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_history_track on public.history_items(track_id);
create index idx_history_user on public.history_items(user_id);
create index idx_history_created on public.history_items(created_at desc);

-- =====================
-- 表现数据表
-- =====================
create table public.performances (
  id text primary key,
  history_item_id text not null references public.history_items(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null default 'douyin',
  published_at timestamptz,
  -- 互动指标
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  followers integer not null default 0,
  -- 高级指标
  completion_rate real,
  avg_watch_time real,
  -- 转化指标
  sales integer,
  revenue real,
  click_rate real,
  --
  strategy text,
  source text not null default 'screenshot',
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  calibrated_at timestamptz
);

create index idx_perf_track on public.performances(track_id);
create index idx_perf_user on public.performances(user_id);

-- =====================
-- 订阅/配额表
-- =====================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  quota_total integer not null default 50,    -- 每月总配额
  quota_used integer not null default 0,      -- 本月已用
  quota_reset_at timestamptz not null,        -- 下次重置时间
  started_at timestamptz not null default now(),
  expires_at timestamptz
);

create unique index idx_sub_user on public.subscriptions(user_id);
```

### 3.2 Row Level Security（RLS）

```sql
-- 所有表启用 RLS
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.memories enable row level security;
alter table public.history_items enable row level security;
alter table public.performances enable row level security;
alter table public.subscriptions enable row level security;

-- 统一策略：用户只能读写自己的数据
create policy "users_own_data" on public.profiles
  for all using (id = auth.uid());

create policy "users_own_data" on public.tracks
  for all using (user_id = auth.uid());

create policy "users_own_data" on public.memories
  for all using (user_id = auth.uid());

create policy "users_own_data" on public.history_items
  for all using (user_id = auth.uid());

create policy "users_own_data" on public.performances
  for all using (user_id = auth.uid());

create policy "users_own_data" on public.subscriptions
  for all using (user_id = auth.uid());
```

### 3.3 自动触发器

```sql
-- 新用户注册时自动创建 profile + 免费订阅
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);

  insert into public.subscriptions (user_id, plan, quota_total, quota_used, quota_reset_at)
  values (new.id, 'free', 50, 0, date_trunc('month', now()) + interval '1 month');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 每月配额自动重置（通过 Supabase pg_cron 或应用层检查）
```

---

## 四、代码改造清单

### 4.1 新增依赖

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 4.2 新增文件

```
src/lib/supabase/
  ├── client.ts           -- 浏览器端 Supabase 客户端（createBrowserClient）
  ├── server.ts           -- 服务端 Supabase 客户端（createServerClient，用于 API Route）
  ├── middleware.ts        -- 刷新 session 的 Next.js middleware
  └── types.ts            -- 从 Supabase CLI 生成的 Database 类型

src/app/
  ├── middleware.ts        -- Next.js middleware，刷新 auth session
  ├── login/
  │   └── page.tsx         -- 登录页（手机号 + OTP）
  └── api/
      └── auth/
          └── callback/
              └── route.ts -- Supabase Auth 回调处理

src/lib/
  └── api-guard.ts         -- API 路由鉴权 + 限流 + 配额检查的统一 wrapper

src/hooks/
  └── useAuth.ts           -- 前端 auth hook（当前用户、登录状态、登出）
```

### 4.3 改造现有文件

#### Store 层（改动最大）

**useTrackStore.ts — 从 localStorage persist 改为 Supabase CRUD**

```
改造前：zustand persist middleware → localStorage（daoxin_v1）
改造后：zustand store（无 persist）+ Supabase 读写函数

关键变化：
- 移除 persist middleware
- 所有写操作改为 async，调用 Supabase client
- 增加 hydrate() 方法：登录后从 Supabase 拉取用户数据填充 store
- 增加 syncToSupabase() 方法：写操作时同步到远端
- Track/Memory/History 的 CRUD 全部走 Supabase
```

**usePerformanceStore.ts — 同上**

```
移除 persist middleware → Supabase CRUD
```

**useSettingsStore.ts — 保留 localStorage**

```
模型选择是客户端偏好，不需要云端同步，保持不变。
```

#### API 路由层

**所有 6 个 API Route 统一改造：**

```typescript
// 改造前
export async function POST(req: Request) {
  const body = await req.json();
  // 直接处理...
}

// 改造后
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req, { user, supabase }) => {
  const body = await req.json();
  // user 已鉴权，supabase 是当前用户的客户端
  // 配额已检查，限流已通过
});
```

**api-guard.ts 统一处理：**

```
1. 验证 Supabase Auth session → 401
2. Zod 校验请求体 → 400
3. 检查用户配额（subscription.quota_used < quota_total）→ 403
4. 简单限流（per-user，内存计数 / Upstash Redis）→ 429
5. 通过后递增 quota_used，执行业务逻辑
```

#### 前端页面层

**page.tsx（主页面）**

```
- 增加 auth 检查：未登录 → 跳转 /login
- 登录后调用 store.hydrate() 从 Supabase 加载数据
```

**新增 login/page.tsx**

```
- 手机号输入 + 发送验证码 + 输入 OTP
- 调用 supabase.auth.signInWithOtp({ phone })
- 验证成功 → 跳转主页
- 打字机风格 UI，与主应用一致
```

### 4.4 数据迁移方案

首次登录的老用户需要将 localStorage 数据迁移到 Supabase：

```
用户首次登录
  → 检测 localStorage 中是否有 daoxin_v1 数据
  → 有 → 弹窗："检测到本地数据，是否导入到云端？"
    → 确认 → 批量写入 Supabase（tracks + memories + history + performances）
    → 成功 → 清除 localStorage 旧数据
    → 失败 → 保留本地数据，提示稍后重试
  → 无 → 正常使用
```

---

## 五、环境变量

```env
# .env.local 新增
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...    # 仅服务端使用，不暴露给前端

# 已有（不变）
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...

# 可选（P1 阶段）
DASHSCOPE_API_KEY=sk-...              # Qwen embedding 用
UPSTASH_REDIS_URL=https://...         # 限流用（如果不用内存计数）
UPSTASH_REDIS_TOKEN=...
```

---

## 六、实施阶段

### 第一阶段：基础设施（P0-①②③ 一起做）

按依赖关系排序的实施步骤：

```
Step 1  Supabase 项目初始化
        - 创建 Supabase 项目
        - 执行建表 SQL（含 pgvector 扩展、RLS 策略、触发器）
        - 配置 Auth（启用 Phone OTP）
        - 获取 URL + Key 写入 .env.local

Step 2  Supabase 客户端集成
        - 安装 @supabase/supabase-js + @supabase/ssr
        - 创建 src/lib/supabase/（client.ts, server.ts, types.ts）
        - 创建 src/app/middleware.ts（session 刷新）

Step 3  认证流程
        - 创建 login/page.tsx（手机号 OTP 登录）
        - 创建 src/hooks/useAuth.ts
        - 主页面增加 auth 守卫（未登录跳转 login）

Step 4  Store 层改造
        - useTrackStore：移除 persist → Supabase CRUD + hydrate()
        - usePerformanceStore：同上
        - 数据迁移逻辑（localStorage → Supabase）

Step 5  API 安全层
        - 创建 src/lib/api-guard.ts（鉴权 + Zod 校验 + 配额 + 限流）
        - 6 个 API Route 全部接入 api-guard
        - 订阅配额检查逻辑

Step 6  测试验证
        - 注册新用户 → 创建赛道 → 生成文案 → 全流程测通
        - 老用户 localStorage 迁移测试
        - API 未登录访问 → 401
        - 配额耗尽 → 403
        - npx next build 通过
```

### 第二阶段：核心体验（P1）

```
Step 7  记忆向量化
        - 新增 /api/embed 路由（调 Qwen text-embedding-v3）
        - 写入记忆时生成 embedding 存入 memories.embedding 列
        - buildMemoryPrompt 改为混合检索：向量 0.7 + 词重叠 0.3

Step 8  生成流程健壮性
        - 所有 fetch 加 AbortController
        - 错误分类（网络 / 模型 / 配额）+ 对应 UI 提示
        - 超时提示（>15s）

Step 9  历史记录利用
        - 生成完成后，从结果中提取 pattern 摘要写入记忆
```

### 第三阶段：规模化（P2，用户量上来后）

```
Step 10  记忆分层存储（热/冷）
Step 11  Prompt 版本管理 + A/B 测试
Step 12  多模型成本路由（轻量 step 用便宜模型）
Step 13  部署优化（压缩、CDN、环境校验、nanoid）
Step 14  微信登录接入
```

---

## 七、风险与对策

| 风险 | 对策 |
|------|------|
| Supabase 手机 OTP 需要 Twilio 配置 | Supabase 支持自定义 SMS provider，可对接阿里云短信（国内到达率更高） |
| Supabase 免费额度限制 | Free 计划：500MB 数据库 + 50k Auth 用户 + 5GB 存储，初期足够。超出后升 Pro $25/月 |
| localStorage 迁移数据量大 | 分批写入，加 loading 进度条，失败可重试 |
| RLS 性能 | 热查询加索引（已设计），50 条记忆级别不会有性能问题 |
| 手机号验证码成本 | 免费额度内无成本，超出后约 0.04 元/条 |

---

## 八、验收标准

第一阶段完成后，应满足：

- [ ] 新用户可通过手机号注册登录
- [ ] 登录后所有数据（赛道、记忆、历史、表现数据）存储在 Supabase
- [ ] 换设备登录同一账号，数据完整同步
- [ ] 未登录用户访问 API 返回 401
- [ ] 用户只能看到自己的数据（RLS 生效）
- [ ] 免费用户每月 50 次生成配额，超出提示
- [ ] 老用户 localStorage 数据可一键迁移到云端
- [ ] `npx next build` 零错误通过

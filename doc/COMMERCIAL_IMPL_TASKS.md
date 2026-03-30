# 道心文案商用化 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将道心文案从纯前端 localStorage 应用升级为多用户 SaaS，实现 Supabase 数据持久化 + 手机号登录 + API 鉴权限流 + 配额控制。

**Architecture:** 用 Supabase 替换 localStorage 作为主存储。前端 Zustand store 保留为内存态缓存，登录后从 Supabase hydrate，写操作直接调 Supabase Client。API Route 通过统一 guard wrapper 实现鉴权、校验、限流、配额。

**Tech Stack:** Next.js 16 / Supabase (Auth + PostgreSQL + RLS) / @supabase/ssr / Zustand 5 / Zod 4

---

## File Structure

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/supabase/client.ts` | 浏览器端 Supabase 客户端单例 |
| `src/lib/supabase/server.ts` | 服务端 Supabase 客户端工厂（API Route 用） |
| `src/lib/supabase/types.ts` | Database 类型定义（从 Schema 手写，后续可用 CLI 生成） |
| `src/lib/api-guard.ts` | API Route 统一 wrapper：鉴权 + Zod 校验 + 配额 + 限流 |
| `src/hooks/useAuth.ts` | 前端 auth hook：当前用户、登录状态、登出 |
| `src/app/login/page.tsx` | 登录页（手机号 OTP） |
| `src/app/auth/callback/route.ts` | Supabase Auth 回调处理 |
| `middleware.ts` | Next.js middleware：刷新 Supabase auth session |
| `supabase/migrations/001_initial_schema.sql` | 数据库建表脚本 |

### 改造文件

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 @supabase/supabase-js, @supabase/ssr |
| `.env.local` | 新增 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |
| `src/store/useTrackStore.ts` | 移除 persist middleware → Supabase CRUD + hydrate |
| `src/store/usePerformanceStore.ts` | 同上 |
| `src/app/page.tsx` | 增加 auth 守卫 |
| `src/app/api/generate/route.ts` | 接入 api-guard |
| `src/app/api/search/route.ts` | 接入 api-guard |
| `src/app/api/match-track/route.ts` | 接入 api-guard |
| `src/app/api/generate-knowledge/route.ts` | 接入 api-guard |
| `src/app/api/performance/parse-screenshot/route.ts` | 接入 api-guard |
| `src/app/api/performance/analyze/route.ts` | 接入 api-guard |

---

## Task 1: Supabase 项目初始化 + 数据库建表

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: 创建 Supabase 项目**

在 https://supabase.com 创建新项目（区域选 Northeast Asia / Singapore），记录：
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 2: 创建数据库迁移文件**

```sql
-- supabase/migrations/001_initial_schema.sql

-- pgvector（P1 记忆向量化预留）
create extension if not exists vector;

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  nickname text,
  avatar_url text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== tracks =====
create table public.tracks (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#8b5cf6',
  banned text not null default '',
  few_shot text not null default '',
  ref_accounts text[] not null default '{}',
  knowledge_id text,
  knowledge_seeded boolean not null default false,
  profile_completed boolean not null default false,
  target_audience text not null default '',
  persona text not null default '',
  product text not null default '',
  content_goal text not null default '',
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tracks_user on public.tracks(user_id);

-- ===== memories =====
create table public.memories (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('style', 'content', 'avoid', 'pattern')),
  content text not null,
  source text not null check (source in ('ai', 'user', 'system')),
  confidence real not null default 0.4,
  hit_count integer not null default 0,
  embedding vector(1024),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_memories_track on public.memories(track_id);
create index idx_memories_user on public.memories(user_id);

-- ===== history_items =====
create table public.history_items (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_name text not null,
  track_color text not null,
  prompt text not null,
  result jsonb not null,
  strategy text,
  used_memory_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_history_track on public.history_items(track_id);
create index idx_history_user on public.history_items(user_id);
create index idx_history_created on public.history_items(created_at desc);

-- ===== performances =====
create table public.performances (
  id text primary key,
  history_item_id text not null references public.history_items(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null default 'douyin',
  published_at timestamptz,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  followers integer not null default 0,
  completion_rate real,
  avg_watch_time real,
  sales integer,
  revenue real,
  click_rate real,
  strategy text,
  source text not null default 'screenshot',
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  calibrated_at timestamptz
);
create index idx_perf_track on public.performances(track_id);
create index idx_perf_user on public.performances(user_id);

-- ===== subscriptions =====
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  quota_total integer not null default 50,
  quota_used integer not null default 0,
  quota_reset_at timestamptz not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz
);
create unique index idx_sub_user on public.subscriptions(user_id);

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.memories enable row level security;
alter table public.history_items enable row level security;
alter table public.performances enable row level security;
alter table public.subscriptions enable row level security;

create policy "users_own_profiles" on public.profiles for all using (id = auth.uid());
create policy "users_own_tracks" on public.tracks for all using (user_id = auth.uid());
create policy "users_own_memories" on public.memories for all using (user_id = auth.uid());
create policy "users_own_history" on public.history_items for all using (user_id = auth.uid());
create policy "users_own_performances" on public.performances for all using (user_id = auth.uid());
create policy "users_own_subscriptions" on public.subscriptions for all using (user_id = auth.uid());

-- ===== Trigger: 新用户自动创建 profile + 订阅 =====
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
```

- [ ] **Step 3: 在 Supabase Dashboard 执行 SQL**

打开 Supabase Dashboard → SQL Editor → 粘贴上述 SQL → Run。

- [ ] **Step 4: 配置 Auth**

Supabase Dashboard → Authentication → Providers → 启用 Phone（选择 SMS provider，推荐阿里云短信或 Twilio）。

- [ ] **Step 5: 写入环境变量**

在 `.env.local` 中追加：
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add Supabase database schema with RLS and triggers"
```

---

## Task 2: 安装依赖 + Supabase 客户端

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/types.ts`

- [ ] **Step 1: 安装 Supabase 包**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 创建 Database 类型**

```typescript
// src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          nickname: string | null;
          avatar_url: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          nickname?: string | null;
          avatar_url?: string | null;
          plan?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      tracks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          color: string;
          banned: string;
          few_shot: string;
          ref_accounts: string[];
          knowledge_id: string | null;
          knowledge_seeded: boolean;
          profile_completed: boolean;
          target_audience: string;
          persona: string;
          product: string;
          content_goal: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tracks']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tracks']['Insert']>;
      };
      memories: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          type: string;
          content: string;
          source: string;
          confidence: number;
          hit_count: number;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'created_at' | 'updated_at' | 'embedding'> & { embedding?: number[] | null };
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      history_items: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          track_name: string;
          track_color: string;
          prompt: string;
          result: Json;
          strategy: string | null;
          used_memory_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['history_items']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['history_items']['Insert']>;
      };
      performances: {
        Row: {
          id: string;
          history_item_id: string;
          track_id: string;
          user_id: string;
          platform: string;
          published_at: string | null;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          followers: number;
          completion_rate: number | null;
          avg_watch_time: number | null;
          sales: number | null;
          revenue: number | null;
          click_rate: number | null;
          strategy: string | null;
          source: string;
          recorded_at: string;
          updated_at: string;
          calibrated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['performances']['Row'], 'recorded_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['performances']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          quota_total: number;
          quota_used: number;
          quota_reset_at: string;
          started_at: string;
          expires_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
    };
  };
}
```

- [ ] **Step 3: 创建浏览器端客户端**

```typescript
// src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: 创建服务端客户端**

```typescript
// src/lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 中无法 set cookie，忽略
          }
        },
      },
    },
  );
}
```

- [ ] **Step 5: 验证 build**

```bash
npx next build
```

Expected: 编译通过，无 TypeScript 错误。

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/ package.json package-lock.json
git commit -m "feat: add Supabase client setup and database types"
```

---

## Task 3: Next.js Middleware（Auth Session 刷新）

**Files:**
- Create: `middleware.ts`（项目根目录）

- [ ] **Step 1: 创建 middleware**

```typescript
// middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // 刷新 session（重要：不要删除这行）
  const { data: { user } } = await supabase.auth.getUser();

  // 未登录用户访问非 login 页面 → 跳转登录
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 已登录用户访问 login → 跳转首页
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 排除静态资源和 API 路由（API 有自己的鉴权）
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Next.js middleware for Supabase auth session refresh"
```

---

## Task 4: 登录页

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: 创建 Auth 回调路由**

```typescript
// src/app/auth/callback/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(origin);
}
```

- [ ] **Step 2: 创建登录页**

```tsx
// src/app/login/page.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Stage = 'phone' | 'otp' | 'loading';

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const sendOtp = async () => {
    setError('');
    // 补全国际区号
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    setStage('loading');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (err) {
      setError(err.message);
      setStage('phone');
      return;
    }
    setStage('otp');
  };

  const verifyOtp = async () => {
    setError('');
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    setStage('loading');
    const { error: err } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    });
    if (err) {
      setError(err.message);
      setStage('otp');
      return;
    }
    // 验证成功，middleware 会自动跳转首页
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl shadow-lg" style={{ background: 'var(--bg-screen, #FCF9F0)', border: '1px solid var(--border-light, #C8BFA9)' }}>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-noto-serif), serif', color: 'var(--text-primary, #2A2522)' }}>
          道心文案
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--text-muted, #8C8276)' }}>登录以开始创作</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {stage === 'phone' && (
          <>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary, #3A3530)' }}>手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="输入手机号"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)' }}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
            />
            <button
              onClick={sendOtp}
              disabled={!phone || phone.length < 11}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent, #E85D3B)' }}
            >
              发送验证码
            </button>
          </>
        )}

        {stage === 'otp' && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #3A3530)' }}>
              验证码已发送到 {phone}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="输入 6 位验证码"
              className="w-full px-4 py-3 rounded-lg border text-base mb-4 outline-none tracking-widest text-center"
              style={{ borderColor: 'var(--border-light, #C8BFA9)', background: 'var(--bg-base, #F5F1E8)', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent, #E85D3B)' }}
            >
              验证登录
            </button>
            <button
              onClick={() => { setStage('phone'); setOtp(''); }}
              className="w-full py-2 mt-2 text-sm"
              style={{ color: 'var(--text-muted, #8C8276)' }}
            >
              返回修改手机号
            </button>
          </>
        )}

        {stage === 'loading' && (
          <div className="text-center py-8" style={{ color: 'var(--text-muted, #8C8276)' }}>
            处理中...
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 验证 build**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/login/ src/app/auth/
git commit -m "feat: add phone OTP login page and auth callback"
```

---

## Task 5: useAuth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: 创建 useAuth hook**

```typescript
// src/hooks/useAuth.ts

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 初始化时获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, loading, signOut };
}
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook for client-side auth state"
```

---

## Task 6: API Guard（鉴权 + 校验 + 配额 + 限流）

**Files:**
- Create: `src/lib/api-guard.ts`

- [ ] **Step 1: 创建 api-guard**

```typescript
// src/lib/api-guard.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

interface GuardContext {
  user: User;
  supabase: SupabaseClient<Database>;
}

interface GuardOptions {
  /** 是否消耗配额（默认 false，只有 /api/generate 需要） */
  consumeQuota?: boolean;
}

// 简单内存限流：per-user，每分钟最多 30 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function withApiGuard(
  handler: (req: Request, ctx: GuardContext) => Promise<Response>,
  options: GuardOptions = {},
) {
  return async (req: Request): Promise<Response> => {
    try {
      // 1. 鉴权
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }

      // 2. 限流
      if (!checkRateLimit(user.id)) {
        return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
      }

      // 3. 配额检查（仅对需要消耗配额的路由）
      if (options.consumeQuota) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('quota_total, quota_used, quota_reset_at')
          .eq('user_id', user.id)
          .single();

        if (!sub) {
          return NextResponse.json({ error: '订阅信息不存在' }, { status: 403 });
        }

        // 检查是否需要重置配额（新月份）
        const resetAt = new Date(sub.quota_reset_at);
        if (new Date() >= resetAt) {
          const nextReset = new Date(resetAt);
          nextReset.setMonth(nextReset.getMonth() + 1);
          await supabase
            .from('subscriptions')
            .update({ quota_used: 0, quota_reset_at: nextReset.toISOString() })
            .eq('user_id', user.id);
          sub.quota_used = 0;
        }

        if (sub.quota_used >= sub.quota_total) {
          return NextResponse.json(
            { error: '本月生成配额已用完', quota: { used: sub.quota_used, total: sub.quota_total } },
            { status: 403 },
          );
        }

        // 递增使用量
        await supabase
          .from('subscriptions')
          .update({ quota_used: sub.quota_used + 1 })
          .eq('user_id', user.id);
      }

      // 4. 执行业务逻辑
      return handler(req, { user, supabase });
    } catch (error) {
      console.error('[API Guard] Error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 },
      );
    }
  };
}
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-guard.ts
git commit -m "feat: add API guard with auth, rate limiting, and quota"
```

---

## Task 7: 改造 6 个 API Route 接入 guard

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/match-track/route.ts`
- Modify: `src/app/api/generate-knowledge/route.ts`
- Modify: `src/app/api/performance/parse-screenshot/route.ts`
- Modify: `src/app/api/performance/analyze/route.ts`

- [ ] **Step 1: 改造 /api/generate（消耗配额）**

```typescript
// src/app/api/generate/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

const schemas = {
  step1: z.object({
    analysis: z.string().describe('2-3句话的选题潜力分析'),
    appeals: z.array(z.string()).describe('满足的诉求维度，如：有趣、有共鸣'),
    desire: z.string().describe('触达的底层欲望'),
    strategy: z.string().describe('推荐的策略法：明道/动心/启思/破局'),
    subDirection: z.string().describe('推荐的子方向，如：认知颠覆、情感共鸣'),
    goal: z.string().describe('建议侧重的数据目标'),
    suggestion: z.string().describe('一句话优化建议'),
  }),
  step3: z.object({
    topics: z.array(z.object({
      title: z.string().describe('选题标题'),
      hook: z.string().describe('前3秒开场钩子，20-40字'),
      hookType: z.string().describe('钩子类型：反常识/情感共鸣/故事悬念/权威数据/利益承诺/好奇缺口'),
      executionPlan: z.string().describe('执行思路：镜头开场、内容展开、情绪节奏、结尾引导，100-150字'),
    })).describe('3个不同角度的选题方案'),
  }),
  step4: z.object({
    copytext: z.string().describe('完整文案正文，200-400字，换行用\\n'),
    titles: z.array(z.string()).describe('3个爆款标题'),
    emotionCurve: z.array(z.object({
      section: z.string().describe('段落标识，如：开头/展开/高潮/结尾'),
      emotion: z.string().describe('情绪标注，如：好奇、共鸣、惊讶、感动'),
      intensity: z.number().describe('情绪强度 1-10'),
    })).describe('情绪曲线标注'),
    shootingGuide: z.object({
      opening: z.string().describe('开场镜头建议'),
      style: z.string().describe('画面风格建议'),
      transitions: z.string().describe('转场方式建议'),
    }).describe('拍摄指导'),
    structure: z.string().describe('使用的内容结构模型名称，如SCQA、故事弧线'),
    music: z.array(z.string()).describe('3个BGM风格推荐'),
    memory_entries: z.array(z.object({
      type: z.enum(['style', 'content', 'avoid', 'pattern']).describe('记忆类型'),
      content: z.string().describe('一句话规则描述'),
    })).describe('从本次生成中提取的创作规律，2-4条'),
  }),
  polish: z.object({
    copytext: z.string().describe('润色后的正文内容，换行用\\n'),
    titles: z.array(z.string()).describe('润色后的3个爆款标题'),
    music: z.array(z.string()).describe('3个BGM风格推荐'),
  }),
};

export const POST = withApiGuard(async (req) => {
  const { systemPrompt, userMessage, step, model: modelId } = await req.json();

  if (!systemPrompt || !userMessage || !step) {
    return Response.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const schema = schemas[step as keyof typeof schemas];
  if (!schema) {
    return Response.json({ error: `未知 step: ${step}` }, { status: 400 });
  }

  const { object } = await generateObject({
    model: resolveModel(modelId),
    schema,
    system: systemPrompt,
    prompt: userMessage,
    maxOutputTokens: 4096,
  });

  return Response.json(object);
}, { consumeQuota: true });
```

- [ ] **Step 2: 改造 /api/search**

```typescript
// src/app/api/search/route.ts

import { tavily } from '@tavily/core';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const { query } = await req.json();

  if (!query) {
    return Response.json({ error: '缺少搜索关键词' }, { status: 400 });
  }

  if (!process.env.TAVILY_API_KEY) {
    return Response.json({ context: '' });
  }

  const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const response = await client.search(query, {
    maxResults: 5,
    searchDepth: 'basic',
    includeAnswer: true,
  });

  const parts: string[] = [];
  if (response.answer) {
    parts.push(`【综合摘要】${response.answer}`);
  }
  if (response.results?.length) {
    const snippets = response.results
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.title}：${r.content}`)
      .join('\n');
    parts.push(`【相关资讯】\n${snippets}`);
  }

  return Response.json({ context: parts.join('\n\n') });
});
```

- [ ] **Step 3: 改造 /api/match-track**

```typescript
// src/app/api/match-track/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { getBuiltinTrackNames } from '@/lib/knowledge-seeds';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const { name, desc, model: modelId } = await req.json();

  if (!name) {
    return Response.json({ error: '缺少赛道名称' }, { status: 400 });
  }

  const trackList = getBuiltinTrackNames()
    .map(t => `${t.id}:${t.name}(${t.category})`)
    .join(', ');

  const { object } = await generateObject({
    model: resolveModel(modelId),
    schema: z.object({
      match: z.string().nullable().describe('最匹配的内置赛道 ID，如果没有合适的返回 null'),
      matchName: z.string().nullable().describe('匹配的赛道名称'),
      confidence: z.number().describe('匹配置信度 0-1'),
      reason: z.string().describe('一句话匹配原因'),
    }),
    system: `你是赛道分类助手。以下是内置赛道列表：\n${trackList}\n\n请根据用户新建的赛道信息，从内置列表中选出最接近的赛道。如果置信度低于0.5，match 返回 null。`,
    prompt: `赛道名称：${name}\n描述：${desc || '无'}`,
    maxOutputTokens: 256,
  });

  return Response.json(object);
});
```

- [ ] **Step 4: 改造 /api/generate-knowledge**

```typescript
// src/app/api/generate-knowledge/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

export const POST = withApiGuard(async (req) => {
  const { name, desc, model: modelId } = await req.json();

  if (!name) {
    return Response.json({ error: '缺少赛道名称' }, { status: 400 });
  }

  const { object } = await generateObject({
    model: resolveModel(modelId),
    schema: z.object({
      seeds: z.array(z.object({
        type: z.enum(['style', 'content', 'avoid', 'pattern']).describe('记忆类型'),
        content: z.string().describe('一句话规则描述，简洁有用'),
        confidence: z.number().describe('置信度 0.4-0.7'),
      })).describe('15-20条知识种子'),
    }),
    system: `你是短视频内容策略专家。请为用户的赛道生成一套知识种子，用于指导AI生成高质量短视频文案。

知识种子分为4种类型：
- content: 内容偏好（受众画像、选题角度、素材方向）
- pattern: 成功模式（爆款规律、钩子模板、结构公式）
- style: 风格偏好（语气、节奏、表达方式）
- avoid: 需要避免的（合规红线、常见错误、禁忌表达）

要求：
1. 生成15-20条种子，覆盖上述4种类型
2. 每条一句话，简洁实用，可直接指导创作
3. content 和 pattern 各5-7条，style 2-3条，avoid 3-4条
4. 内容要具体到该赛道，不要泛泛而谈
5. confidence 根据通用性设置：通用规律0.6，具体技巧0.5，经验性判断0.4`,
    prompt: `赛道名称：${name}\n描述：${desc || '无'}`,
    maxOutputTokens: 2048,
  });

  return Response.json(object);
});
```

- [ ] **Step 5: 改造 /api/performance/parse-screenshot**

```typescript
// src/app/api/performance/parse-screenshot/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

const metricsSchema = z.object({
  views: z.number().describe('播放量'),
  likes: z.number().describe('点赞数'),
  comments: z.number().describe('评论数'),
  shares: z.number().describe('转发/分享数'),
  saves: z.number().describe('收藏数'),
  followers: z.number().describe('涨粉数，找不到则为0'),
  completionRate: z.number().nullable().describe('完播率0-100，找不到则null'),
  avgWatchTime: z.number().nullable().describe('平均观看时长(秒)，找不到则null'),
});

const SYSTEM_PROMPT = `你是一个数据提取助手。用户会上传抖音视频数据截图，请从中提取各项指标数字。

注意：
- 如果数字显示为"1.2万"，请转换为12000
- 如果数字显示为"1.2w"，请转换为12000
- 如果某个指标在截图中找不到，用0代替（completionRate和avgWatchTime用null）`;

export const POST = withApiGuard(async (req) => {
  const { image, modelId } = await req.json();
  if (!image) {
    return Response.json({ error: 'Missing image data' }, { status: 400 });
  }

  const model = resolveModel(modelId);
  const { object } = await generateObject({
    model,
    schema: metricsSchema,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', image },
        { type: 'text', text: '请从这张抖音数据截图中提取各项指标数字。' },
      ],
    }],
  });

  return Response.json(object);
});
```

- [ ] **Step 6: 改造 /api/performance/analyze**

```typescript
// src/app/api/performance/analyze/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/model';
import { withApiGuard } from '@/lib/api-guard';

const analysisSchema = z.object({
  overview: z.string().describe('1-2段总体洞察，用中文'),
  strategyRecommendation: z.object({
    best: z.string().describe('最有效的策略名称'),
    reason: z.string().describe('为什么这个策略最有效'),
    avoid: z.string().optional().describe('建议避免的策略'),
    avoidReason: z.string().optional().describe('为什么避免'),
  }),
  suggestions: z.array(z.object({
    action: z.string().describe('具体可执行的建议'),
    evidence: z.string().describe('基于数据的依据'),
  })).describe('3条内容建议'),
  memoryActions: z.array(z.object({
    action: z.enum(['add', 'remove', 'modify']).describe('操作类型'),
    memoryId: z.string().optional().describe('目标记忆ID，remove/modify时必填'),
    type: z.string().optional().describe('记忆类型，add时必填'),
    content: z.string().describe('记忆内容'),
    reason: z.string().describe('建议原因'),
  })).describe('记忆调整建议'),
});

const SYSTEM_PROMPT = `你是道心文案的数据分析师。基于用户的内容表现数据，分析哪些创作策略和模式最有效，给出具体的优化建议。

道心四法策略：
- 明道·洞见 (mingdao)：认知落差驱动，目标是完播率和收藏
- 动心·共鸣 (dongxin)：情感共振驱动，目标是点赞和评论
- 启思·价值 (qisi)：实用价值驱动，目标是收藏和关注
- 破局·创意 (poju)：新奇视角驱动，目标是转发和出圈

请基于真实数据给出分析，不要猜测或编造数据。建议要具体、可执行。`;

export const POST = withApiGuard(async (req) => {
  const { summary, topItems, bottomItems, memories, profile, modelId } = await req.json();

  const userMessage = `
## 赛道表现统计
总发布: ${summary.totalPosts} 条
平均播放: ${Math.round(summary.avgViews)}
平均点赞: ${Math.round(summary.avgLikes)}
平均收藏: ${Math.round(summary.avgSaves)}

## 策略分布
${Object.entries(summary.strategyBreakdown).map(([k, v]: [string, unknown]) => {
  const data = v as { count: number; avgViews: number; avgLikes: number; avgSaves: number };
  return `${k}: ${data.count}条, 均播${Math.round(data.avgViews)}, 均赞${Math.round(data.avgLikes)}, 均藏${Math.round(data.avgSaves)}`;
}).join('\n')}

## 表现最好的内容 (Top 3)
${topItems.map((item: { prompt: string; strategy: string; views: number; likes: number; saves: number }, i: number) =>
  `${i + 1}. 「${item.prompt}」策略:${item.strategy} 播放:${item.views} 点赞:${item.likes} 收藏:${item.saves}`
).join('\n')}

## 表现最差的内容 (Bottom 3)
${bottomItems.map((item: { prompt: string; strategy: string; views: number; likes: number; saves: number }, i: number) =>
  `${i + 1}. 「${item.prompt}」策略:${item.strategy} 播放:${item.views} 点赞:${item.likes} 收藏:${item.saves}`
).join('\n')}

## 当前记忆规则 (${memories.length} 条)
${memories.map((m: { type: string; content: string; confidence: number; id: string }) =>
  `[${m.type}] ${m.content} (置信度:${Math.round(m.confidence * 100)}%, ID:${m.id})`
).join('\n')}

${profile ? `## 赛道画像
目标受众: ${profile.targetAudience || '未设置'}
人设: ${profile.persona || '未设置'}
变现: ${profile.product || '未设置'}
目标: ${profile.contentGoal || '未设置'}` : ''}

请分析以上数据，给出总体洞察、策略推荐、内容建议、以及记忆调整建议。`;

  const model = resolveModel(modelId);
  const { object } = await generateObject({
    model,
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    prompt: userMessage,
  });

  return Response.json(object);
});
```

- [ ] **Step 7: 验证 build**

```bash
npx next build
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API guard to all routes (auth + rate limit + quota)"
```

---

## Task 8: 改造 useTrackStore（localStorage → Supabase）

**Files:**
- Modify: `src/store/useTrackStore.ts`

这是改动最大的文件。核心思路：移除 `persist` middleware，所有写操作变为 async 同时写 Supabase，增加 `hydrate()` 方法在登录后拉取数据。

- [ ] **Step 1: 重写 useTrackStore**

```typescript
// src/store/useTrackStore.ts

'use client';

import { create } from 'zustand';
import type { Track, MemoryEntry, MemoryType, AIMemoryExtraction, HistoryItem } from '@/types';
import { DEFAULT_TRACKS } from '@/lib/constants';
import { genMemoryId, mergeAIMemories, decayMemories } from '@/lib/memory';
import { getBuiltinTrack } from '@/lib/knowledge-seeds';
import { createClient } from '@/lib/supabase/client';

function genId() {
  return 't' + Date.now() + Math.random().toString(36).slice(2, 6);
}

const MAX_HISTORY = 200;

interface TrackStore {
  tracks: Track[];
  currentId: string | null;
  history: HistoryItem[];
  hydrated: boolean;

  // Hydrate from Supabase after login
  hydrate: (userId: string) => Promise<void>;

  // History actions
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  deleteHistoryItem: (id: string) => void;
  clearTrackHistory: (trackId: string) => void;

  // Track actions
  selectTrack: (id: string) => void;
  addTrack: (data: Omit<Track, 'id'>, userId: string) => Promise<string>;
  updateTrack: (id: string, data: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  getTrack: (id: string | null) => Track | undefined;
  getCurrentTrack: () => Track | undefined;
  incrementCount: (id: string) => void;

  // Legacy memory
  appendMemory: (id: string, text: string) => void;

  // Structured memory actions
  seedKnowledge: (trackId: string, knowledgeId: string, userId: string) => void;
  seedCustomKnowledge: (trackId: string, seeds: { type: MemoryType; content: string; confidence: number }[], userId: string) => void;
  addMemoryEntry: (trackId: string, entry: { type: MemoryType; content: string; source: 'ai' | 'user' | 'system' }, userId: string) => void;
  updateMemoryEntry: (trackId: string, memoryId: string, updates: Partial<Pick<MemoryEntry, 'content' | 'type' | 'confidence'>>) => void;
  deleteMemoryEntry: (trackId: string, memoryId: string) => void;
  mergeAIMemoryEntries: (trackId: string, entries: AIMemoryExtraction[], userId: string) => void;
  boostMemory: (trackId: string, memoryId: string, delta: number) => void;
  runDecay: (trackId: string) => void;
  getTrackMemories: (trackId: string) => MemoryEntry[];
}

// 辅助：fire-and-forget Supabase 写入（不阻塞 UI）
const sb = () => createClient();

export const useTrackStore = create<TrackStore>()(
  (set, get) => ({
    tracks: [],
    currentId: null,
    history: [],
    hydrated: false,

    hydrate: async (userId: string) => {
      const supabase = sb();

      // 拉取 tracks
      const { data: dbTracks } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // 拉取 memories
      const { data: dbMemories } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId);

      // 拉取 history
      const { data: dbHistory } = await supabase
        .from('history_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

      // 组装 Track + memories
      const memoriesByTrack = new Map<string, MemoryEntry[]>();
      for (const m of dbMemories || []) {
        const list = memoriesByTrack.get(m.track_id) || [];
        list.push({
          id: m.id,
          trackId: m.track_id,
          type: m.type as MemoryType,
          content: m.content,
          source: m.source as 'ai' | 'user' | 'system',
          confidence: m.confidence,
          hitCount: m.hit_count,
          createdAt: new Date(m.created_at).getTime(),
          updatedAt: new Date(m.updated_at).getTime(),
        });
        memoriesByTrack.set(m.track_id, list);
      }

      const tracks: Track[] = (dbTracks || []).map(t => ({
        id: t.id,
        name: t.name,
        desc: t.description,
        color: t.color,
        banned: t.banned,
        fewShot: t.few_shot,
        memory: '',
        memories: memoriesByTrack.get(t.id) || [],
        knowledgeId: t.knowledge_id || undefined,
        knowledgeSeeded: t.knowledge_seeded,
        profile: (t.target_audience || t.persona || t.product || t.content_goal)
          ? { targetAudience: t.target_audience, persona: t.persona, product: t.product, contentGoal: t.content_goal }
          : undefined,
        profileCompleted: t.profile_completed,
        refAccounts: t.ref_accounts,
        count: t.count,
      }));

      const history: HistoryItem[] = (dbHistory || []).map(h => ({
        id: h.id,
        trackId: h.track_id,
        trackName: h.track_name,
        trackColor: h.track_color,
        prompt: h.prompt,
        result: h.result as HistoryItem['result'],
        createdAt: new Date(h.created_at).getTime(),
        usedMemoryIds: h.used_memory_ids,
        strategy: h.strategy as HistoryItem['strategy'],
      }));

      // 如果用户没有赛道，创建默认赛道
      if (tracks.length === 0) {
        for (const dt of DEFAULT_TRACKS) {
          const id = genId();
          const track: Track = { ...dt, id, memories: [] };
          tracks.push(track);
          // 同步写入 Supabase
          supabase.from('tracks').insert({
            id,
            user_id: userId,
            name: dt.name,
            description: dt.desc,
            color: dt.color,
            banned: dt.banned,
            few_shot: dt.fewShot,
            ref_accounts: dt.refAccounts,
            count: 0,
            knowledge_seeded: false,
            profile_completed: false,
            target_audience: '',
            persona: '',
            product: '',
            content_goal: '',
          }).then(() => {});
        }
      }

      set({
        tracks,
        history,
        currentId: tracks[0]?.id ?? null,
        hydrated: true,
      });
    },

    addHistoryItem: (item) => {
      const id = 'h' + Date.now() + Math.random().toString(36).slice(2, 6);
      const createdAt = Date.now();

      set(s => ({
        history: [{ ...item, id, createdAt }, ...s.history].slice(0, MAX_HISTORY),
      }));

      // 异步写 Supabase（需要 userId，从 auth 获取）
      sb().auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        sb().from('history_items').insert({
          id,
          track_id: item.trackId,
          user_id: user.id,
          track_name: item.trackName,
          track_color: item.trackColor,
          prompt: item.prompt,
          result: item.result as unknown as Record<string, unknown>,
          strategy: item.strategy || null,
          used_memory_ids: item.usedMemoryIds || [],
        }).then(() => {});
      });
    },

    deleteHistoryItem: (id) => {
      set(s => ({ history: s.history.filter(h => h.id !== id) }));
      sb().from('history_items').delete().eq('id', id).then(() => {});
    },

    clearTrackHistory: (trackId) => {
      set(s => ({ history: s.history.filter(h => h.trackId !== trackId) }));
      sb().from('history_items').delete().eq('track_id', trackId).then(() => {});
    },

    selectTrack: (id) => set({ currentId: id }),

    addTrack: async (data, userId) => {
      const id = genId();
      set(s => ({
        tracks: [...s.tracks, { ...data, id, memories: data.memories || [] }],
        currentId: id,
      }));

      await sb().from('tracks').insert({
        id,
        user_id: userId,
        name: data.name,
        description: data.desc,
        color: data.color,
        banned: data.banned,
        few_shot: data.fewShot,
        ref_accounts: data.refAccounts,
        knowledge_id: data.knowledgeId || null,
        knowledge_seeded: data.knowledgeSeeded || false,
        profile_completed: data.profileCompleted || false,
        target_audience: data.profile?.targetAudience || '',
        persona: data.profile?.persona || '',
        product: data.profile?.product || '',
        content_goal: data.profile?.contentGoal || '',
        count: data.count,
      });

      return id;
    },

    updateTrack: (id, data) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? { ...t, ...data } : t),
      }));

      // 构建 Supabase update payload（只传变更字段）
      const dbUpdate: Record<string, unknown> = {};
      if (data.name !== undefined) dbUpdate.name = data.name;
      if (data.desc !== undefined) dbUpdate.description = data.desc;
      if (data.color !== undefined) dbUpdate.color = data.color;
      if (data.banned !== undefined) dbUpdate.banned = data.banned;
      if (data.fewShot !== undefined) dbUpdate.few_shot = data.fewShot;
      if (data.refAccounts !== undefined) dbUpdate.ref_accounts = data.refAccounts;
      if (data.knowledgeId !== undefined) dbUpdate.knowledge_id = data.knowledgeId;
      if (data.knowledgeSeeded !== undefined) dbUpdate.knowledge_seeded = data.knowledgeSeeded;
      if (data.profileCompleted !== undefined) dbUpdate.profile_completed = data.profileCompleted;
      if (data.count !== undefined) dbUpdate.count = data.count;
      if (data.profile) {
        dbUpdate.target_audience = data.profile.targetAudience;
        dbUpdate.persona = data.profile.persona;
        dbUpdate.product = data.profile.product;
        dbUpdate.content_goal = data.profile.contentGoal;
      }
      dbUpdate.updated_at = new Date().toISOString();

      if (Object.keys(dbUpdate).length > 1) {
        sb().from('tracks').update(dbUpdate).eq('id', id).then(() => {});
      }
    },

    deleteTrack: (id) => {
      set(s => {
        const remaining = s.tracks.filter(t => t.id !== id);
        return {
          tracks: remaining,
          currentId: s.currentId === id ? (remaining[0]?.id ?? null) : s.currentId,
        };
      });
      // Cascade delete 由 DB 外键处理
      sb().from('tracks').delete().eq('id', id).then(() => {});
    },

    getTrack: (id) => get().tracks.find(t => t.id === id),

    getCurrentTrack: () => {
      const { tracks, currentId } = get();
      return tracks.find(t => t.id === currentId);
    },

    incrementCount: (id) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === id ? { ...t, count: t.count + 1 } : t),
      }));
      const track = get().tracks.find(t => t.id === id);
      if (track) {
        sb().from('tracks').update({ count: track.count, updated_at: new Date().toISOString() }).eq('id', id).then(() => {});
      }
    },

    appendMemory: (id, text) => {
      const now = Date.now();
      const entryId = genMemoryId();
      const entry: MemoryEntry = {
        id: entryId, trackId: id, type: 'content', content: text,
        source: 'ai', confidence: 0.4, hitCount: 0, createdAt: now, updatedAt: now,
      };

      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== id) return t;
          return { ...t, memory: t.memory ? t.memory + '\n' + text : text, memories: [...(t.memories || []), entry] };
        }),
      }));

      sb().auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        sb().from('memories').insert({
          id: entryId, track_id: id, user_id: user.id,
          type: 'content', content: text, source: 'ai', confidence: 0.4, hit_count: 0,
        }).then(() => {});
      });
    },

    seedKnowledge: (trackId, knowledgeId, userId) => {
      const builtin = getBuiltinTrack(knowledgeId);
      if (!builtin) return;
      const now = Date.now();
      const seedEntries: MemoryEntry[] = builtin.seeds.map((seed, i) => ({
        id: genMemoryId() + i, trackId, type: seed.type, content: seed.content,
        source: 'system' as const, confidence: seed.confidence, hitCount: 0, createdAt: now, updatedAt: now,
      }));

      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId || t.knowledgeSeeded) return t;
          return { ...t, knowledgeId, knowledgeSeeded: true, memories: [...(t.memories || []), ...seedEntries] };
        }),
      }));

      // 写入 Supabase
      sb().from('tracks').update({ knowledge_id: knowledgeId, knowledge_seeded: true }).eq('id', trackId).then(() => {});
      const rows = seedEntries.map(e => ({
        id: e.id, track_id: trackId, user_id: userId,
        type: e.type, content: e.content, source: e.source, confidence: e.confidence, hit_count: 0,
      }));
      sb().from('memories').insert(rows).then(() => {});
    },

    seedCustomKnowledge: (trackId, seeds, userId) => {
      const now = Date.now();
      const seedEntries: MemoryEntry[] = seeds.map((seed, i) => ({
        id: genMemoryId() + i, trackId, type: seed.type, content: seed.content,
        source: 'system' as const, confidence: seed.confidence, hitCount: 0, createdAt: now, updatedAt: now,
      }));

      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId || t.knowledgeSeeded) return t;
          return { ...t, knowledgeId: 'custom', knowledgeSeeded: true, memories: [...(t.memories || []), ...seedEntries] };
        }),
      }));

      sb().from('tracks').update({ knowledge_id: 'custom', knowledge_seeded: true }).eq('id', trackId).then(() => {});
      const rows = seedEntries.map(e => ({
        id: e.id, track_id: trackId, user_id: userId,
        type: e.type, content: e.content, source: e.source, confidence: e.confidence, hit_count: 0,
      }));
      sb().from('memories').insert(rows).then(() => {});
    },

    addMemoryEntry: (trackId, { type, content, source }, userId) => {
      const now = Date.now();
      const entryId = genMemoryId();
      const entry: MemoryEntry = {
        id: entryId, trackId, type, content, source,
        confidence: source === 'user' ? 0.9 : 0.4, hitCount: 0, createdAt: now, updatedAt: now,
      };

      set(s => ({
        tracks: s.tracks.map(t => t.id === trackId ? { ...t, memories: [...(t.memories || []), entry] } : t),
      }));

      sb().from('memories').insert({
        id: entryId, track_id: trackId, user_id: userId,
        type, content, source, confidence: entry.confidence, hit_count: 0,
      }).then(() => {});
    },

    updateMemoryEntry: (trackId, memoryId, updates) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, memories: (t.memories || []).map(m => m.id === memoryId ? { ...m, ...updates, updatedAt: Date.now() } : m) };
        }),
      }));

      const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.content !== undefined) dbUpdate.content = updates.content;
      if (updates.type !== undefined) dbUpdate.type = updates.type;
      if (updates.confidence !== undefined) dbUpdate.confidence = updates.confidence;
      sb().from('memories').update(dbUpdate).eq('id', memoryId).then(() => {});
    },

    deleteMemoryEntry: (trackId, memoryId) => {
      set(s => ({
        tracks: s.tracks.map(t => t.id === trackId ? { ...t, memories: (t.memories || []).filter(m => m.id !== memoryId) } : t),
      }));
      sb().from('memories').delete().eq('id', memoryId).then(() => {});
    },

    mergeAIMemoryEntries: (trackId, entries, userId) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          const merged = mergeAIMemories(t.memories || [], trackId, entries);
          // 同步新增的记忆到 Supabase
          const existingIds = new Set((t.memories || []).map(m => m.id));
          const newMemories = merged.filter(m => !existingIds.has(m.id));
          if (newMemories.length > 0) {
            const rows = newMemories.map(m => ({
              id: m.id, track_id: trackId, user_id: userId,
              type: m.type, content: m.content, source: m.source, confidence: m.confidence, hit_count: m.hitCount,
            }));
            sb().from('memories').insert(rows).then(() => {});
          }
          // 更新已有记忆的 confidence
          for (const m of merged) {
            if (existingIds.has(m.id)) {
              const old = (t.memories || []).find(om => om.id === m.id);
              if (old && (old.confidence !== m.confidence || old.content !== m.content)) {
                sb().from('memories').update({ confidence: m.confidence, content: m.content, updated_at: new Date().toISOString() }).eq('id', m.id).then(() => {});
              }
            }
          }
          return { ...t, memories: merged };
        }),
      }));
    },

    boostMemory: (trackId, memoryId, delta) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          const updated = (t.memories || [])
            .map(m => m.id === memoryId
              ? { ...m, confidence: Math.max(0, Math.min(1.0, m.confidence + delta)), updatedAt: Date.now() }
              : m
            )
            .filter(m => m.confidence >= 0.05);
          // 同步
          const mem = updated.find(m => m.id === memoryId);
          if (mem) {
            sb().from('memories').update({ confidence: mem.confidence, updated_at: new Date().toISOString() }).eq('id', memoryId).then(() => {});
          } else {
            // 已被过滤掉（confidence < 0.05），删除
            sb().from('memories').delete().eq('id', memoryId).then(() => {});
          }
          return { ...t, memories: updated };
        }),
      }));
    },

    runDecay: (trackId) => {
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.id !== trackId) return t;
          const decayed = decayMemories(t.memories || [], trackId);
          // 同步被删除的记忆
          const keptIds = new Set(decayed.map(m => m.id));
          const removedIds = (t.memories || []).filter(m => !keptIds.has(m.id)).map(m => m.id);
          if (removedIds.length > 0) {
            sb().from('memories').delete().in('id', removedIds).then(() => {});
          }
          // 同步衰减后的 confidence
          for (const m of decayed) {
            const old = (t.memories || []).find(om => om.id === m.id);
            if (old && old.confidence !== m.confidence) {
              sb().from('memories').update({ confidence: m.confidence }).eq('id', m.id).then(() => {});
            }
          }
          return { ...t, memories: decayed };
        }),
      }));
    },

    getTrackMemories: (trackId) => {
      const track = get().tracks.find(t => t.id === trackId);
      return track?.memories || [];
    },
  })
);
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

注意：此步骤会产生编译错误，因为调用 `addTrack`、`seedKnowledge` 等方法的组件现在需要传 `userId` 参数。这些将在 Task 10 中修复。

- [ ] **Step 3: Commit**

```bash
git add src/store/useTrackStore.ts
git commit -m "feat: migrate useTrackStore from localStorage to Supabase"
```

---

## Task 9: 改造 usePerformanceStore（localStorage → Supabase）

**Files:**
- Modify: `src/store/usePerformanceStore.ts`

- [ ] **Step 1: 重写 usePerformanceStore**

```typescript
// src/store/usePerformanceStore.ts

'use client';

import { create } from 'zustand';
import type { ContentPerformance, TrackPerformanceSummary, PerformanceLevel } from '@/types/performance';
import { createClient } from '@/lib/supabase/client';

function genId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function computeScore(p: ContentPerformance): number {
  return p.views * 0.3 + p.likes * 0.25 + p.saves * 0.2 + p.comments * 0.1 + p.shares * 0.1 + p.followers * 0.05;
}

const sb = () => createClient();

interface PerformanceStore {
  performances: ContentPerformance[];
  hydrated: boolean;

  hydrate: (userId: string) => Promise<void>;
  addPerformance: (data: Omit<ContentPerformance, 'id' | 'recordedAt' | 'updatedAt'>, userId: string) => string;
  updatePerformance: (id: string, metrics: Partial<ContentPerformance>) => void;
  deletePerformance: (id: string) => void;

  getByHistoryItem: (historyItemId: string) => ContentPerformance | undefined;
  getByTrack: (trackId: string) => ContentPerformance[];
  getTrackSummary: (trackId: string) => TrackPerformanceSummary;
  getPerformanceLevel: (id: string) => PerformanceLevel;
}

export const usePerformanceStore = create<PerformanceStore>()(
  (set, get) => ({
    performances: [],
    hydrated: false,

    hydrate: async (userId: string) => {
      const { data } = await sb()
        .from('performances')
        .select('*')
        .eq('user_id', userId);

      const performances: ContentPerformance[] = (data || []).map(p => ({
        id: p.id,
        historyItemId: p.history_item_id,
        trackId: p.track_id,
        platform: p.platform as ContentPerformance['platform'],
        publishedAt: p.published_at ? new Date(p.published_at).getTime() : Date.now(),
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        followers: p.followers,
        completionRate: p.completion_rate ?? undefined,
        avgWatchTime: p.avg_watch_time ?? undefined,
        sales: p.sales ?? undefined,
        revenue: p.revenue ?? undefined,
        clickRate: p.click_rate ?? undefined,
        strategy: p.strategy as ContentPerformance['strategy'],
        source: p.source as ContentPerformance['source'],
        recordedAt: new Date(p.recorded_at).getTime(),
        updatedAt: new Date(p.updated_at).getTime(),
        calibratedAt: p.calibrated_at ? new Date(p.calibrated_at).getTime() : undefined,
      }));

      set({ performances, hydrated: true });
    },

    addPerformance: (data, userId) => {
      const id = genId();
      const now = Date.now();
      const perf = { ...data, id, recordedAt: now, updatedAt: now };

      set(s => ({ performances: [...s.performances, perf] }));

      sb().from('performances').insert({
        id,
        history_item_id: data.historyItemId,
        track_id: data.trackId,
        user_id: userId,
        platform: data.platform,
        published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        saves: data.saves,
        followers: data.followers,
        completion_rate: data.completionRate ?? null,
        avg_watch_time: data.avgWatchTime ?? null,
        sales: data.sales ?? null,
        revenue: data.revenue ?? null,
        click_rate: data.clickRate ?? null,
        strategy: data.strategy || null,
        source: data.source,
      }).then(() => {});

      return id;
    },

    updatePerformance: (id, metrics) => {
      set(s => ({
        performances: s.performances.map(p => p.id === id ? { ...p, ...metrics, updatedAt: Date.now() } : p),
      }));

      const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (metrics.views !== undefined) dbUpdate.views = metrics.views;
      if (metrics.likes !== undefined) dbUpdate.likes = metrics.likes;
      if (metrics.comments !== undefined) dbUpdate.comments = metrics.comments;
      if (metrics.shares !== undefined) dbUpdate.shares = metrics.shares;
      if (metrics.saves !== undefined) dbUpdate.saves = metrics.saves;
      if (metrics.followers !== undefined) dbUpdate.followers = metrics.followers;
      if (metrics.calibratedAt !== undefined) dbUpdate.calibrated_at = new Date(metrics.calibratedAt).toISOString();
      sb().from('performances').update(dbUpdate).eq('id', id).then(() => {});
    },

    deletePerformance: (id) => {
      set(s => ({ performances: s.performances.filter(p => p.id !== id) }));
      sb().from('performances').delete().eq('id', id).then(() => {});
    },

    getByHistoryItem: (historyItemId) => get().performances.find(p => p.historyItemId === historyItemId),
    getByTrack: (trackId) => get().performances.filter(p => p.trackId === trackId),

    getTrackSummary: (trackId) => {
      const items = get().performances.filter(p => p.trackId === trackId);
      const total = items.length;
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const strategyBreakdown: TrackPerformanceSummary['strategyBreakdown'] = {};
      for (const p of items) {
        const key = p.strategy;
        if (!strategyBreakdown[key]) strategyBreakdown[key] = { count: 0, avgViews: 0, avgLikes: 0, avgSaves: 0 };
        strategyBreakdown[key].count++;
      }
      for (const key of Object.keys(strategyBreakdown)) {
        const group = items.filter(p => p.strategy === key);
        strategyBreakdown[key].avgViews = avg(group.map(p => p.views));
        strategyBreakdown[key].avgLikes = avg(group.map(p => p.likes));
        strategyBreakdown[key].avgSaves = avg(group.map(p => p.saves));
      }

      const scored = items.map(p => ({ id: p.id, score: computeScore(p) })).sort((a, b) => b.score - a.score);
      const top20 = Math.max(1, Math.ceil(total * 0.2));
      const bottom20 = Math.max(1, Math.ceil(total * 0.2));

      return {
        trackId, totalPosts: total,
        avgViews: avg(items.map(p => p.views)),
        avgLikes: avg(items.map(p => p.likes)),
        avgSaves: avg(items.map(p => p.saves)),
        strategyBreakdown,
        topPerformers: scored.slice(0, top20).map(s => s.id),
        bottomPerformers: scored.slice(-bottom20).map(s => s.id),
      };
    },

    getPerformanceLevel: (id) => {
      const perf = get().performances.find(p => p.id === id);
      if (!perf) return 'average';
      const trackItems = get().performances.filter(p => p.trackId === perf.trackId);
      if (trackItems.length < 2) return 'good';
      const scores = trackItems.map(p => ({ id: p.id, score: computeScore(p) })).sort((a, b) => b.score - a.score);
      const rank = scores.findIndex(s => s.id === id);
      const pct = rank / scores.length;
      if (pct < 0.2) return 'excellent';
      if (pct < 0.5) return 'good';
      if (pct < 0.8) return 'average';
      return 'poor';
    },
  })
);
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/store/usePerformanceStore.ts
git commit -m "feat: migrate usePerformanceStore from localStorage to Supabase"
```

---

## Task 10: 前端集成（auth 守卫 + hydrate + 修复编译错误）

**Files:**
- Modify: `src/app/page.tsx`
- Modify: 所有调用了 `addTrack`、`seedKnowledge`、`addMemoryEntry` 等方法的组件（需要传 `userId`）

这个 Task 需要逐个查找并修复所有因 store 接口变更导致的编译错误。

- [ ] **Step 1: 改造 page.tsx 增加 auth 守卫和 hydrate**

```tsx
// src/app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTrackStore } from '@/store/useTrackStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';

export default function Home() {
  const { user, loading } = useAuth();
  const hydrated = useTrackStore(s => s.hydrated);
  const hydrateTrack = useTrackStore(s => s.hydrate);
  const hydratePerf = usePerformanceStore(s => s.hydrate);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || hydrated) return;
    Promise.all([hydrateTrack(user.id), hydratePerf(user.id)])
      .catch(e => setError(e.message));
  }, [user, hydrated, hydrateTrack, hydratePerf]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: 'var(--text-muted, #8C8276)' }}>加载中...</p>
      </div>
    );
  }

  if (!user) return null; // middleware 会跳转 login

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: '#dc2626' }}>数据加载失败：{error}</p>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #F5F1E8)' }}>
        <p style={{ color: 'var(--text-muted, #8C8276)' }}>加载数据...</p>
      </div>
    );
  }

  return <AppLayout />;
}
```

- [ ] **Step 2: 修复所有调用处的 userId 参数**

在所有调用了 `addTrack`、`seedKnowledge`、`seedCustomKnowledge`、`addMemoryEntry`、`mergeAIMemoryEntries`、`addPerformance` 的组件中，通过 `useAuth` hook 获取 `user.id` 并传入。

查找方式：
```bash
npx next build 2>&1 | grep "error TS"
```

逐个修复每个编译错误。典型修复模式：

```typescript
// 改造前
const { addTrack } = useTrackStore();
addTrack(trackData);

// 改造后
const { addTrack } = useTrackStore();
const { user } = useAuth();
addTrack(trackData, user!.id);
```

- [ ] **Step 3: 验证 build 通过**

```bash
npx next build
```

Expected: 零 TypeScript 错误，编译成功。

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: integrate auth guard, hydrate, fix all userId callsites"
```

---

## Task 11: localStorage 数据迁移

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 在 page.tsx 中增加迁移逻辑**

在 hydrate 之前，检测 localStorage 中是否有旧数据。如果有，弹出迁移提示。

```typescript
// 在 page.tsx 的 useEffect 中，hydrate 前加入迁移检测

useEffect(() => {
  if (!user || hydrated) return;

  const migrateIfNeeded = async () => {
    const oldData = localStorage.getItem('daoxin_v1');
    if (oldData) {
      try {
        const parsed = JSON.parse(oldData);
        if (parsed.state?.tracks?.length > 0) {
          const confirmed = window.confirm('检测到本地数据，是否导入到云端？');
          if (confirmed) {
            await migrateLocalDataToSupabase(user.id, parsed.state);
            localStorage.removeItem('daoxin_v1');
            localStorage.removeItem('daoxin_performance');
          }
        }
      } catch {
        // 解析失败，忽略旧数据
      }
    }

    await Promise.all([hydrateTrack(user.id), hydratePerf(user.id)]);
  };

  migrateIfNeeded().catch(e => setError(e.message));
}, [user, hydrated, hydrateTrack, hydratePerf]);
```

迁移函数（写在同文件或独立工具文件中）：

```typescript
async function migrateLocalDataToSupabase(userId: string, state: { tracks: Track[]; history: HistoryItem[] }) {
  const supabase = createClient();

  // 迁移 tracks
  for (const t of state.tracks) {
    await supabase.from('tracks').upsert({
      id: t.id,
      user_id: userId,
      name: t.name,
      description: t.desc,
      color: t.color,
      banned: t.banned,
      few_shot: t.fewShot,
      ref_accounts: t.refAccounts,
      knowledge_id: t.knowledgeId || null,
      knowledge_seeded: t.knowledgeSeeded || false,
      profile_completed: t.profileCompleted || false,
      target_audience: t.profile?.targetAudience || '',
      persona: t.profile?.persona || '',
      product: t.profile?.product || '',
      content_goal: t.profile?.contentGoal || '',
      count: t.count,
    });

    // 迁移 memories
    for (const m of t.memories || []) {
      await supabase.from('memories').upsert({
        id: m.id,
        track_id: m.trackId,
        user_id: userId,
        type: m.type,
        content: m.content,
        source: m.source,
        confidence: m.confidence,
        hit_count: m.hitCount,
      });
    }
  }

  // 迁移 history
  for (const h of state.history || []) {
    await supabase.from('history_items').upsert({
      id: h.id,
      track_id: h.trackId,
      user_id: userId,
      track_name: h.trackName,
      track_color: h.trackColor,
      prompt: h.prompt,
      result: h.result as unknown as Record<string, unknown>,
      strategy: h.strategy || null,
      used_memory_ids: h.usedMemoryIds || [],
    });
  }

  // 迁移 performance
  const oldPerfData = localStorage.getItem('daoxin_performance');
  if (oldPerfData) {
    const perfState = JSON.parse(oldPerfData);
    for (const p of perfState.state?.performances || []) {
      await supabase.from('performances').upsert({
        id: p.id,
        history_item_id: p.historyItemId,
        track_id: p.trackId,
        user_id: userId,
        platform: p.platform,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        followers: p.followers,
        completion_rate: p.completionRate ?? null,
        avg_watch_time: p.avgWatchTime ?? null,
        strategy: p.strategy || null,
        source: p.source,
      });
    }
  }
}
```

- [ ] **Step 2: 验证 build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add localStorage to Supabase data migration on first login"
```

---

## Task 12: 端到端验证

- [ ] **Step 1: 启动 dev server**

```bash
npm run dev
```

- [ ] **Step 2: 测试新用户注册流程**

1. 打开 http://localhost:3000 → 应跳转到 /login
2. 输入手机号 → 发送验证码 → 输入 OTP → 登录成功
3. 自动跳转首页，看到 3 个默认赛道
4. 检查 Supabase Dashboard → profiles 表有新记录
5. 检查 tracks 表有 3 条默认赛道

- [ ] **Step 3: 测试核心功能**

1. 选择赛道 → 输入主题 → 完成 Step 1-5 生成流程
2. 检查 history_items 表有新记录
3. 检查 memories 表有 AI 提取的记忆
4. 检查 subscriptions 表 quota_used 递增

- [ ] **Step 4: 测试 API 安全**

1. 登出后直接 curl POST /api/generate → 应返回 401
2. 登录后正常请求 → 应成功
3. 快速连续请求 > 30 次 → 应返回 429

- [ ] **Step 5: 测试数据迁移（如果有旧数据）**

1. 在 localStorage 中存入旧格式 daoxin_v1 数据
2. 登录 → 应弹出迁移提示
3. 确认迁移 → 数据出现在 Supabase 中

- [ ] **Step 6: 生产构建验证**

```bash
npx next build
```

Expected: 零错误，编译成功。

- [ ] **Step 7: Commit 最终状态**

```bash
git add -A
git commit -m "feat: complete Supabase migration - auth, data persistence, API security"
```

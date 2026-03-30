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
  values (new.id, coalesce(new.phone, new.email));

  insert into public.subscriptions (user_id, plan, quota_total, quota_used, quota_reset_at)
  values (new.id, 'free', 50, 0, date_trunc('month', now()) + interval '1 month');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

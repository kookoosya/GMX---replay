-- GMXReply Arcade runtime sync scaffold
-- Phase 53: groundwork only. This file is safe to merge now and wire later.
-- It does NOT enable live runtime sync by itself.

create table if not exists public.arcade_runtime_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_react_game text not null default 'rift',
  selected_bridge_game text not null default 'neon',
  free_showcase_seen boolean not null default false,
  runtime_version text not null default 'phase53',
  local_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.arcade_runtime_runs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null,
  score integer not null check (score >= 0),
  duration_sec integer,
  source text not null default 'react',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.arcade_runtime_resumes (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null,
  payload jsonb not null default '{}'::jsonb,
  score_hint integer not null default 0,
  runtime_version text not null default 'phase53',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_key)
);

create index if not exists arcade_runtime_runs_user_game_idx
  on public.arcade_runtime_runs (user_id, game_key, score desc, created_at desc);

create index if not exists arcade_runtime_runs_game_score_idx
  on public.arcade_runtime_runs (game_key, score desc, created_at desc);

create index if not exists arcade_runtime_resumes_user_game_idx
  on public.arcade_runtime_resumes (user_id, game_key, updated_at desc);

alter table public.arcade_runtime_profiles enable row level security;
alter table public.arcade_runtime_runs enable row level security;
alter table public.arcade_runtime_resumes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_profiles' and policyname = 'arcade_runtime_profiles_select_own'
  ) then
    create policy arcade_runtime_profiles_select_own on public.arcade_runtime_profiles
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_profiles' and policyname = 'arcade_runtime_profiles_upsert_own'
  ) then
    create policy arcade_runtime_profiles_upsert_own on public.arcade_runtime_profiles
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_runs' and policyname = 'arcade_runtime_runs_select_own'
  ) then
    create policy arcade_runtime_runs_select_own on public.arcade_runtime_runs
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_runs' and policyname = 'arcade_runtime_runs_insert_own'
  ) then
    create policy arcade_runtime_runs_insert_own on public.arcade_runtime_runs
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_resumes' and policyname = 'arcade_runtime_resumes_select_own'
  ) then
    create policy arcade_runtime_resumes_select_own on public.arcade_runtime_resumes
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_resumes' and policyname = 'arcade_runtime_resumes_upsert_own'
  ) then
    create policy arcade_runtime_resumes_upsert_own on public.arcade_runtime_resumes
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.touch_arcade_runtime_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_arcade_runtime_profiles_updated_at on public.arcade_runtime_profiles;
create trigger trg_arcade_runtime_profiles_updated_at
before update on public.arcade_runtime_profiles
for each row execute function public.touch_arcade_runtime_updated_at();

drop trigger if exists trg_arcade_runtime_resumes_updated_at on public.arcade_runtime_resumes;
create trigger trg_arcade_runtime_resumes_updated_at
before update on public.arcade_runtime_resumes
for each row execute function public.touch_arcade_runtime_updated_at();

comment on table public.arcade_runtime_profiles is 'Phase 53 scaffold only. Wire live sync later through one runtime gateway.';
comment on table public.arcade_runtime_runs is 'Phase 53 scaffold only. Local runtime stays authoritative until the later cloud sync pass.';
comment on table public.arcade_runtime_resumes is 'Phase 53 scaffold only. Keep using local migration bundles until runtimeAdapter is connected.';

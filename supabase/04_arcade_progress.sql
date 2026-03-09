-- GMXReply Arcade groundwork
-- Phase 14: prepare shared persistence for long runs, resumes, and server-side leaderboards.

create table if not exists public.arcade_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  x_handle text,
  best_neon integer not null default 0,
  best_payload integer not null default 0,
  best_steel integer not null default 0,
  best_star integer not null default 0,
  best_boss integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.arcade_saves (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in ('payload','steel','star','boss')),
  checkpoint_key text not null,
  payload jsonb not null default '{}'::jsonb,
  progress_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_key)
);

create table if not exists public.arcade_scores (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in ('neon','payload','steel','star','boss')),
  score integer not null check (score >= 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists arcade_scores_game_score_idx on public.arcade_scores (game_key, score desc, created_at desc);
create index if not exists arcade_saves_user_game_idx on public.arcade_saves (user_id, game_key);

alter table public.arcade_profiles enable row level security;
alter table public.arcade_saves enable row level security;
alter table public.arcade_scores enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_profiles' and policyname = 'arcade_profiles_select_own'
  ) then
    create policy arcade_profiles_select_own on public.arcade_profiles for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_profiles' and policyname = 'arcade_profiles_upsert_own'
  ) then
    create policy arcade_profiles_upsert_own on public.arcade_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_saves' and policyname = 'arcade_saves_select_own'
  ) then
    create policy arcade_saves_select_own on public.arcade_saves for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_saves' and policyname = 'arcade_saves_upsert_own'
  ) then
    create policy arcade_saves_upsert_own on public.arcade_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_scores' and policyname = 'arcade_scores_insert_own'
  ) then
    create policy arcade_scores_insert_own on public.arcade_scores for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_scores' and policyname = 'arcade_scores_select_all'
  ) then
    create policy arcade_scores_select_all on public.arcade_scores for select using (true);
  end if;
end $$;

create or replace function public.touch_arcade_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_arcade_profiles_updated_at on public.arcade_profiles;
create trigger trg_arcade_profiles_updated_at
before update on public.arcade_profiles
for each row execute function public.touch_arcade_updated_at();

drop trigger if exists trg_arcade_saves_updated_at on public.arcade_saves;
create trigger trg_arcade_saves_updated_at
before update on public.arcade_saves
for each row execute function public.touch_arcade_updated_at();

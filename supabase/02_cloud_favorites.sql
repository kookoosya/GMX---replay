-- GMXReply Supabase schema (additional tables for migrating away from SQLite)
-- Run this in Supabase SQL Editor (service role / SQL editor).
-- Safe to run multiple times.

-- Favorites (saved lines)
create table if not exists public.favorites (
  handle text not null,
  kind text not null,
  reply_hash text not null,
  reply text not null,
  created_at timestamptz not null default now(),
  primary key (handle, kind, reply_hash)
);

create index if not exists idx_favorites_handle_kind_created
  on public.favorites (handle, kind, created_at desc);

-- Cloud lists (pro sync)
create table if not exists public.cloud_lists (
  handle text not null,
  kind text not null,
  scope text not null,
  lang text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (handle, kind, scope, lang)
);

create index if not exists idx_cloud_lists_handle_updated
  on public.cloud_lists (handle, updated_at desc);

-- Optional constraints (won't apply if you already have stricter ones)
do $$
begin
  begin
    alter table public.favorites
      add constraint favorites_kind_chk check (kind in ('gm','gn'));
  exception when duplicate_object then null; end;

  begin
    alter table public.cloud_lists
      add constraint cloud_lists_kind_chk check (kind in ('gm','gn'));
  exception when duplicate_object then null; end;

  begin
    alter table public.cloud_lists
      add constraint cloud_lists_scope_chk check (scope in ('global','lang'));
  exception when duplicate_object then null; end;
end $$;

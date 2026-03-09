-- GMXReply Arcade runtime queue scaffold
-- Phase 53: groundwork only. Safe to merge before live runtime sync.

create table if not exists public.arcade_runtime_sync_queue (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  runtime_version text not null default 'phase53',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists arcade_runtime_sync_queue_user_status_idx
  on public.arcade_runtime_sync_queue (user_id, status, created_at desc);

alter table public.arcade_runtime_sync_queue enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_sync_queue' and policyname = 'arcade_runtime_sync_queue_select_own'
  ) then
    create policy arcade_runtime_sync_queue_select_own on public.arcade_runtime_sync_queue
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'arcade_runtime_sync_queue' and policyname = 'arcade_runtime_sync_queue_insert_own'
  ) then
    create policy arcade_runtime_sync_queue_insert_own on public.arcade_runtime_sync_queue
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.arcade_runtime_sync_queue is 'Phase 53 scaffold only. Queue runtime writes here later through one shared gateway.';

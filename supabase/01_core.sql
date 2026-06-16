-- GMXReply core Supabase schema (users, daily usage, referrals, consume RPC)
-- Run first in Supabase SQL Editor. Safe to re-run (idempotent where possible).

create table if not exists public.users (
  handle text primary key,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create table if not exists public.usage_daily (
  handle text not null,
  day date not null,
  gm_used integer not null default 0,
  gn_used integer not null default 0,
  primary key (handle, day)
);

create index if not exists idx_usage_daily_day
  on public.usage_daily (day desc);

create table if not exists public.referrals (
  inviter_handle text not null,
  invited_handle text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  first_use_at timestamptz,
  legacy boolean not null default false,
  clicks integer not null default 0,
  primary key (inviter_handle, invited_handle)
);

create unique index if not exists uq_referrals_invited_nonlegacy
  on public.referrals (invited_handle)
  where legacy is false;

create or replace function public.usage_daily_consume(
  p_handle text,
  p_day date,
  p_kind text,
  p_by integer default 1,
  p_limit integer default 0,
  p_plan text default 'free'
)
returns table(ok boolean, used integer, "limit" integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := lower(coalesce(p_kind, 'gm'));
  v_by integer := greatest(coalesce(p_by, 1), 1);
  v_lim integer := coalesce(p_limit, 0);
  v_plan text := coalesce(p_plan, 'free');
  v_cur integer := 0;
  v_new integer := 0;
  v_ok boolean := false;
begin
  if coalesce(trim(p_handle), '') = '' then
    return query select false, 0, v_lim, v_plan;
    return;
  end if;

  insert into public.usage_daily (handle, day, gm_used, gn_used)
  values (trim(p_handle), p_day, 0, 0)
  on conflict (handle, day) do nothing;

  select case when v_kind = 'gn' then gn_used else gm_used end
    into v_cur
    from public.usage_daily
   where handle = trim(p_handle) and day = p_day
   for update;

  v_cur := coalesce(v_cur, 0);

  if v_lim >= 999999 then
    v_new := v_cur + v_by;
    v_ok := true;
  elsif v_cur + v_by <= v_lim then
    v_new := v_cur + v_by;
    v_ok := true;
  else
    v_new := v_cur;
    v_ok := false;
  end if;

  if v_ok then
    if v_kind = 'gn' then
      update public.usage_daily set gn_used = v_new where handle = trim(p_handle) and day = p_day;
    else
      update public.usage_daily set gm_used = v_new where handle = trim(p_handle) and day = p_day;
    end if;
  end if;

  return query select v_ok, v_new, v_lim, v_plan;
end;
$$;

grant execute on function public.usage_daily_consume(text, date, text, integer, integer, text) to service_role;

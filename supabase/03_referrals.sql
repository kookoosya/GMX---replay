-- Referrals (Supabase) support objects
-- Run in Supabase SQL Editor

-- Indexes / uniqueness for public.referrals
create unique index if not exists uq_referrals_pair
  on public.referrals (inviter_handle, invited_handle);

create unique index if not exists uq_referrals_invited
  on public.referrals (invited_handle)
  where legacy is false;

create index if not exists idx_referrals_inviter_confirmed
  on public.referrals (inviter_handle, confirmed_at desc);

create index if not exists idx_referrals_inviter_first_use
  on public.referrals (inviter_handle, first_use_at desc);

-- Click audit table (dedup by code+fingerprint)
create table if not exists public.ref_clicks (
  code text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key (code, fingerprint)
);

create index if not exists idx_ref_clicks_code_time
  on public.ref_clicks (code, created_at desc);

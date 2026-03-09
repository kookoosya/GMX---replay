-- GMXReply Arcade runtime RPC scaffold
-- Phase 53: create narrow RPC entry points, but keep the live pass OFF for now.

create or replace function public.arcade_queue_runtime_sync(p_action text, p_payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.arcade_runtime_sync_queue (user_id, action, payload)
  values (auth.uid(), coalesce(nullif(trim(p_action), ''), 'noop'), coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.arcade_pull_runtime_state()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p)
      from public.arcade_runtime_profiles p
      where p.user_id = auth.uid()
      order by p.updated_at desc
      limit 1
    ),
    'recentRuns', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from (
        select *
        from public.arcade_runtime_runs
        where user_id = auth.uid()
        order by created_at desc
        limit 20
      ) r
    ), '[]'::jsonb),
    'resumes', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.updated_at desc)
      from public.arcade_runtime_resumes s
      where s.user_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;

comment on function public.arcade_queue_runtime_sync(text, jsonb) is 'Phase 53 scaffold only. Queue runtime writes; do not wire gameplay directly yet.';
comment on function public.arcade_pull_runtime_state() is 'Phase 53 scaffold only. Pull runtime state through one shared gateway later.';

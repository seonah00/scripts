create table public.gv_expression_packs (
 platform text primary key check(platform in ('red','tiktok')),
 entries jsonb not null default '[]'::jsonb check(jsonb_typeof(entries)='array'),
 updated_at timestamptz,
 last_attempt timestamptz,
 next_attempt timestamptz not null default now(),
 lease_id uuid,
 lease_until timestamptz,
 status text not null default 'pending' check(status in ('pending','running','ready','no_evidence','failed'))
);
alter table public.gv_expression_packs enable row level security;
revoke all on public.gv_expression_packs from anon,authenticated;
grant all on public.gv_expression_packs to service_role;
insert into public.gv_expression_packs(platform) values('red'),('tiktok');
create function public.gv_claim_expression_refresh(p_platform text,p_lease uuid) returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update public.gv_expression_packs set lease_id=p_lease,lease_until=now()+interval '15 minutes',last_attempt=now(),next_attempt=now()+interval '1 day',status='running'
 where platform=p_platform and next_attempt<=now() and (lease_until is null or lease_until<now());
 return found;
end $$;
revoke all on function public.gv_claim_expression_refresh(text,uuid) from public,anon,authenticated;
grant execute on function public.gv_claim_expression_refresh(text,uuid) to service_role;

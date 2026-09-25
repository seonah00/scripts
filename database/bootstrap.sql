-- Apply once to a dedicated Supabase project. No existing app tables are modified.
begin;
create schema if not exists gv_private;
revoke all on schema gv_private from public, anon, authenticated;
create table public.gv_members (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 role text not null default 'student' check(role in ('student','admin')),
 status text not null default 'pending' check(status in ('pending','active','suspended')),
 created_at timestamptz not null default now()
);
create table public.gv_projects (
 id uuid not null, owner uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name)<=200), payload jsonb not null,
 updated_at timestamptz not null default now(), primary key(owner,id)
);
create index gv_projects_owner_updated on public.gv_projects(owner,updated_at desc);
create table public.gv_profiles(owner uuid primary key references auth.users(id) on delete cascade,payload jsonb not null);
create table public.gv_daily_usage(owner uuid not null references auth.users(id) on delete cascade,day date not null,count integer not null check(count between 1 and 30),primary key(owner,day));
alter table public.gv_members enable row level security;
alter table public.gv_projects enable row level security;
alter table public.gv_profiles enable row level security;
alter table public.gv_daily_usage enable row level security;
revoke all on public.gv_members,public.gv_projects,public.gv_profiles,public.gv_daily_usage from anon,authenticated;
grant select on public.gv_members to authenticated;
grant select,insert,update on public.gv_projects,public.gv_profiles to authenticated;
grant all on public.gv_members,public.gv_projects,public.gv_profiles,public.gv_daily_usage to service_role;
create policy gv_members_self on public.gv_members for select to authenticated using(id=(select auth.uid()));
create policy gv_projects_read on public.gv_projects for select to authenticated using(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
create policy gv_projects_insert on public.gv_projects for insert to authenticated with check(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
create policy gv_projects_update on public.gv_projects for update to authenticated using(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active')) with check(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
create policy gv_profiles_read on public.gv_profiles for select to authenticated using(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
create policy gv_profiles_insert on public.gv_profiles for insert to authenticated with check(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
create policy gv_profiles_update on public.gv_profiles for update to authenticated using(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active')) with check(owner=(select auth.uid()) and exists(select 1 from public.gv_members where id=(select auth.uid()) and status='active'));
-- Trigger runs during Auth signup, before a session exists. NEW.id is the trusted
-- auth.users row; it never reads user-supplied role/status metadata.
create function gv_private.new_member() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.gv_members(id,email) values(new.id,coalesce(new.email,''));
 return new;
end;
$$;
revoke all on function gv_private.new_member() from public,anon,authenticated;
create trigger gv_user_created after insert on auth.users for each row execute function gv_private.new_member();
-- Server-only atomic quota reservation. Invoker rights; never exposed to users.
create function public.gv_reserve_usage(p_owner uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare used integer;
begin
 if not exists(select 1 from public.gv_members where id=p_owner and status='active') then return false;end if;
 insert into public.gv_daily_usage(owner,day,count) values(p_owner,(now() at time zone 'Asia/Seoul')::date,1)
 on conflict(owner,day) do update set count=public.gv_daily_usage.count+1 where public.gv_daily_usage.count<30 returning count into used;
 return used is not null;
end;
$$;
revoke all on function public.gv_reserve_usage(uuid) from public,anon,authenticated;
grant execute on function public.gv_reserve_usage(uuid) to service_role;
commit;

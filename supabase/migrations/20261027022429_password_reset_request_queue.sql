create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','resolved')),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null
);
create unique index password_reset_one_pending on public.password_reset_requests(user_id) where status='pending';
create index password_reset_recent_user on public.password_reset_requests(user_id,requested_at desc);
create index password_reset_resolved_by_idx on public.password_reset_requests(resolved_by);
alter table public.password_reset_requests enable row level security;
create policy password_reset_managers_read on public.password_reset_requests for select to authenticated using((select bbs_private.is_admin()));
revoke all on public.password_reset_requests from public,anon,authenticated;
grant select on public.password_reset_requests to authenticated;

-- A separate non-exposed schema gives anonymous callers access to exactly one safe operation.
create schema if not exists bbs_auth_private;
revoke all on schema bbs_auth_private from public;
grant usage on schema bbs_auth_private to anon,authenticated;
create function bbs_auth_private.request_password_reset(p_identifier text) returns void
language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_identifier text:=lower(btrim(p_identifier));
begin
  if v_identifier is null or length(v_identifier) not between 1 and 254 then return; end if;
  select p.id into v_user from public.profiles p join auth.users u on u.id=p.id
    where p.is_active and (lower(p.username)=v_identifier or lower(u.email)=v_identifier) order by p.id limit 1;
  if v_user is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('password-reset:'||v_user::text,0));
  if exists(select 1 from public.password_reset_requests where user_id=v_user and requested_at>now()-interval '10 minutes') then return; end if;
  insert into public.password_reset_requests(user_id) values(v_user)
    on conflict(user_id) where status='pending' do update set requested_at=now();
end;
$$;
revoke all on function bbs_auth_private.request_password_reset(text) from public;
grant execute on function bbs_auth_private.request_password_reset(text) to anon,authenticated;
create function public.request_password_reset(p_identifier text) returns void language sql security invoker set search_path='' as $$
  select bbs_auth_private.request_password_reset(p_identifier);
$$;
revoke all on function public.request_password_reset(text) from public;
grant execute on function public.request_password_reset(text) to anon,authenticated;

create extension if not exists pgcrypto;

do $$ begin
  create type public.bbs_role as enum ('super_admin', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.quote_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired');
exception
  when duplicate_object then null;
end $$;

create schema if not exists bbs_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  role public.bbs_role not null default 'admin',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9._-]{4,64}$')
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_counters (
  year int primary key,
  last_number int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  sequence_number int not null,
  quote_year int not null default extract(year from now())::int,
  quote_number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text,
  seller_name text not null,
  project_description text,
  notes text,
  status public.quote_status not null default 'draft',
  issue_date date not null default current_date,
  valid_until date not null default (current_date + interval '30 days')::date,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_total_non_negative check (subtotal >= 0 and total >= 0)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint quote_items_quantity_positive check (quantity > 0),
  constraint quote_items_unit_price_non_negative check (unit_price >= 0)
);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create or replace function bbs_private.current_role()
returns public.bbs_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function bbs_private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(bbs_private.current_role() in ('super_admin', 'admin'), false)
$$;

create or replace function bbs_private.issue_quote_number()
returns table(sequence_number int, quote_year int, quote_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now())::int;
  next_number int;
begin
  insert into public.quote_counters(year, last_number)
  values (current_year, 1)
  on conflict (year)
  do update set
    last_number = public.quote_counters.last_number + 1,
    updated_at = now()
  returning last_number into next_number;

  sequence_number := next_number;
  quote_year := current_year;
  quote_number := 'BBS-' || current_year::text || '-' || lpad(next_number::text, 4, '0');
  return next;
end;
$$;

revoke all on schema bbs_private from public;
grant usage on schema bbs_private to authenticated;
revoke all on all functions in schema bbs_private from public;
grant execute on function bbs_private.current_role() to authenticated;
grant execute on function bbs_private.is_admin() to authenticated;
grant execute on function bbs_private.issue_quote_number() to authenticated;

create or replace function public.set_quote_number()
returns trigger
language plpgsql
as $$
declare
  issued record;
begin
  if new.quote_number is null or new.quote_number = '' then
    select * into issued from bbs_private.issue_quote_number();
    new.sequence_number := issued.sequence_number;
    new.quote_year := issued.quote_year;
    new.quote_number := issued.quote_number;
  end if;

  return new;
end;
$$;

drop trigger if exists quotes_set_quote_number on public.quotes;
create trigger quotes_set_quote_number
before insert on public.quotes
for each row execute function public.set_quote_number();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quote_counters enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_events enable row level security;

drop policy if exists "profiles_select_admins" on public.profiles;
create policy "profiles_select_admins"
on public.profiles
for select
to authenticated
using (bbs_private.is_admin());

drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin"
on public.profiles
for update
to authenticated
using (bbs_private.current_role() = 'super_admin')
with check (bbs_private.current_role() = 'super_admin');

drop policy if exists "clients_all_admins" on public.clients;
create policy "clients_all_admins"
on public.clients
for all
to authenticated
using (bbs_private.is_admin())
with check (bbs_private.is_admin());

drop policy if exists "quotes_all_admins" on public.quotes;
create policy "quotes_all_admins"
on public.quotes
for all
to authenticated
using (bbs_private.is_admin())
with check (bbs_private.is_admin());

drop policy if exists "quote_items_all_admins" on public.quote_items;
create policy "quote_items_all_admins"
on public.quote_items
for all
to authenticated
using (
  bbs_private.is_admin()
  and exists (
    select 1 from public.quotes
    where public.quotes.id = public.quote_items.quote_id
  )
)
with check (
  bbs_private.is_admin()
  and exists (
    select 1 from public.quotes
    where public.quotes.id = public.quote_items.quote_id
  )
);

drop policy if exists "quote_events_select_admins" on public.quote_events;
create policy "quote_events_select_admins"
on public.quote_events
for select
to authenticated
using (bbs_private.is_admin());

drop policy if exists "quote_events_insert_admins" on public.quote_events;
create policy "quote_events_insert_admins"
on public.quote_events
for insert
to authenticated
with check (bbs_private.is_admin());

create index if not exists clients_name_idx on public.clients using btree (name);
create index if not exists quotes_status_idx on public.quotes using btree (status);
create index if not exists quotes_created_at_idx on public.quotes using btree (created_at desc);
create index if not exists quote_items_quote_id_idx on public.quote_items using btree (quote_id);
create index if not exists quote_events_quote_id_idx on public.quote_events using btree (quote_id);

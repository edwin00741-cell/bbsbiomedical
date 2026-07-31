do $$ begin
  create type public.document_status as enum ('draft', 'sent', 'paid', 'partial', 'overdue', 'void');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('recorded', 'void', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.refund_status as enum ('draft', 'processed', 'void');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Biomedical Business and Service',
  legal_name text,
  email text,
  phone text,
  address text,
  currency text not null default 'USD',
  quote_prefix text not null default 'BBS',
  invoice_prefix text not null default 'FAC',
  credit_note_prefix text not null default 'NC',
  default_validity_days int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  description text,
  unit_price numeric(12,2) not null default 0,
  unit text not null default 'unidad',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric(7,4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_counters (
  document_type text not null,
  year int not null,
  last_number int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (document_type, year)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  sequence_number int not null,
  invoice_year int not null default extract(year from now())::int,
  invoice_number text not null unique,
  quote_id uuid references public.quotes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text,
  seller_name text not null,
  status public.document_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date not null default (current_date + interval '30 days')::date,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(7,4) not null default 0,
  line_subtotal numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  line_total numeric(12,2) generated always as (round((quantity * unit_price) * (1 + tax_rate), 2)) stored,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  sequence_number int not null,
  credit_note_year int not null default extract(year from now())::int,
  credit_note_number text not null unique,
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  reason text,
  status public.document_status not null default 'draft',
  issue_date date not null default current_date,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  reference text,
  amount numeric(12,2) not null,
  status public.payment_status not null default 'recorded',
  paid_at date not null default current_date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0)
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  amount numeric(12,2) not null,
  status public.refund_status not null default 'draft',
  reason text,
  refunded_at date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refunds_amount_positive check (amount > 0)
);

create table if not exists public.document_events (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  document_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.quote_items add column if not exists item_id uuid references public.items(id) on delete set null;

create or replace function bbs_private.issue_document_number(document_type text, prefix text)
returns table(sequence_number int, document_year int, document_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now())::int;
  next_number int;
begin
  insert into public.document_counters(document_type, year, last_number)
  values (document_type, current_year, 1)
  on conflict (document_type, year)
  do update set
    last_number = public.document_counters.last_number + 1,
    updated_at = now()
  returning last_number into next_number;

  sequence_number := next_number;
  document_year := current_year;
  document_number := prefix || '-' || current_year::text || '-' || lpad(next_number::text, 4, '0');
  return next;
end;
$$;

grant execute on function bbs_private.issue_document_number(text, text) to authenticated;

create or replace function public.set_invoice_number()
returns trigger
language plpgsql
as $$
declare
  issued record;
begin
  if new.invoice_number is null or new.invoice_number = '' then
    select * into issued from bbs_private.issue_document_number('invoice', 'FAC');
    new.sequence_number := issued.sequence_number;
    new.invoice_year := issued.document_year;
    new.invoice_number := issued.document_number;
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_set_invoice_number on public.invoices;
create trigger invoices_set_invoice_number
before insert on public.invoices
for each row execute function public.set_invoice_number();

create or replace function public.set_credit_note_number()
returns trigger
language plpgsql
as $$
declare
  issued record;
begin
  if new.credit_note_number is null or new.credit_note_number = '' then
    select * into issued from bbs_private.issue_document_number('credit_note', 'NC');
    new.sequence_number := issued.sequence_number;
    new.credit_note_year := issued.document_year;
    new.credit_note_number := issued.document_number;
  end if;
  return new;
end;
$$;

drop trigger if exists credit_notes_set_credit_note_number on public.credit_notes;
create trigger credit_notes_set_credit_note_number
before insert on public.credit_notes
for each row execute function public.set_credit_note_number();

drop trigger if exists business_settings_set_updated_at on public.business_settings;
create trigger business_settings_set_updated_at before update on public.business_settings
for each row execute function public.set_updated_at();

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists tax_rates_set_updated_at on public.tax_rates;
create trigger tax_rates_set_updated_at before update on public.tax_rates
for each row execute function public.set_updated_at();

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists credit_notes_set_updated_at on public.credit_notes;
create trigger credit_notes_set_updated_at before update on public.credit_notes
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists refunds_set_updated_at on public.refunds;
create trigger refunds_set_updated_at before update on public.refunds
for each row execute function public.set_updated_at();

alter table public.business_settings enable row level security;
alter table public.items enable row level security;
alter table public.tax_rates enable row level security;
alter table public.payment_methods enable row level security;
alter table public.document_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.credit_notes enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.document_events enable row level security;

drop policy if exists "business_settings_all_admins" on public.business_settings;
create policy "business_settings_all_admins" on public.business_settings
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "items_all_admins" on public.items;
create policy "items_all_admins" on public.items
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "tax_rates_all_admins" on public.tax_rates;
create policy "tax_rates_all_admins" on public.tax_rates
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "payment_methods_all_admins" on public.payment_methods;
create policy "payment_methods_all_admins" on public.payment_methods
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "invoices_all_admins" on public.invoices;
create policy "invoices_all_admins" on public.invoices
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "invoice_items_all_admins" on public.invoice_items;
create policy "invoice_items_all_admins" on public.invoice_items
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "credit_notes_all_admins" on public.credit_notes;
create policy "credit_notes_all_admins" on public.credit_notes
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "payments_all_admins" on public.payments;
create policy "payments_all_admins" on public.payments
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "refunds_all_admins" on public.refunds;
create policy "refunds_all_admins" on public.refunds
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

drop policy if exists "document_events_all_admins" on public.document_events;
create policy "document_events_all_admins" on public.document_events
for all to authenticated using (bbs_private.is_admin()) with check (bbs_private.is_admin());

insert into public.business_settings (business_name, legal_name, email, phone, address)
values (
  'Biomedical Business and Service',
  'Biomedical Business and Service',
  'brodriguez@rysbioservices.com',
  '+507 6202-3206',
  'Panamá, Panamá Oeste, La Chorrera, Ave. Libertadores, Calle Los Libertadores, Edificio 1, Local 1.'
)
on conflict do nothing;

insert into public.tax_rates (name, rate)
values ('Sin impuesto', 0)
on conflict do nothing;

insert into public.payment_methods (name, instructions)
values
  ('Transferencia bancaria', 'Registrar referencia bancaria al aplicar el pago.'),
  ('Efectivo', 'Confirmar recibo firmado.'),
  ('Yappy / pago móvil', 'Registrar referencia del pago móvil.')
on conflict do nothing;

create index if not exists items_name_idx on public.items using btree (name);
create index if not exists invoices_status_idx on public.invoices using btree (status);
create index if not exists invoices_created_at_idx on public.invoices using btree (created_at desc);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items using btree (invoice_id);
create index if not exists credit_notes_created_at_idx on public.credit_notes using btree (created_at desc);
create index if not exists payments_paid_at_idx on public.payments using btree (paid_at desc);
create index if not exists refunds_created_at_idx on public.refunds using btree (created_at desc);
create index if not exists document_events_document_idx on public.document_events using btree (document_type, document_id);

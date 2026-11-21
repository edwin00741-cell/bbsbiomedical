create table public.client_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100 and lower(btrim(name)) <> 'predeterminado'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index client_groups_name_unique on public.client_groups (lower(btrim(name)));

create table public.salespeople (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index salespeople_name_unique on public.salespeople (lower(btrim(name)));
alter table public.client_groups enable row level security;
alter table public.salespeople enable row level security;
revoke all on public.client_groups, public.salespeople from anon;
grant select, insert, update, delete on public.client_groups, public.salespeople to authenticated;
grant all on public.client_groups, public.salespeople to service_role;
create policy client_groups_admin_all on public.client_groups for all to authenticated
  using ((select bbs_private.is_admin())) with check ((select bbs_private.is_admin()));
create policy salespeople_admin_all on public.salespeople for all to authenticated
  using ((select bbs_private.is_admin())) with check ((select bbs_private.is_admin()));
create trigger client_groups_updated_at before update on public.client_groups
  for each row execute function public.set_updated_at();
create trigger salespeople_updated_at before update on public.salespeople
  for each row execute function public.set_updated_at();

alter table public.clients
  add column group_id uuid references public.client_groups(id) on delete restrict,
  add column salesperson_id uuid references public.salespeople(id) on delete restrict,
  add column shipping_address text,
  add column is_active boolean not null default true,
  add column payment_terms text not null default 'days' check (payment_terms in ('cod', 'days')),
  add column payment_terms_days integer not null default 30,
  add column payment_method_id uuid references public.payment_methods(id) on delete restrict,
  add column tax_exempt boolean not null default false,
  add column public_notes text,
  add column statement_footer text,
  add constraint clients_payment_terms_days_check check (
    (payment_terms = 'cod' and payment_terms_days = 0) or
    (payment_terms = 'days' and payment_terms_days between 0 and 3650)
  );
create index clients_group_id_idx on public.clients(group_id);
create index clients_salesperson_id_idx on public.clients(salesperson_id);
create index clients_payment_method_id_idx on public.clients(payment_method_id);
create index clients_active_name_idx on public.clients(is_active, name, id);
create index if not exists invoices_client_issue_idx on public.invoices(client_id, issue_date desc, created_at desc);

-- Existing team members are available as salespeople; customers and documents remain unchanged.
insert into public.salespeople(name)
select distinct btrim(full_name) from public.profiles
where is_active and char_length(btrim(full_name)) between 2 and 150
on conflict do nothing;

create view public.bbs_client_directory with (security_invoker = true) as
select c.*, coalesce(g.name, 'Predeterminado') as group_name,
  s.name as salesperson_name, pm.name as payment_method_name,
  coalesce(summary.balance, 0::numeric) as balance,
  summary.next_due_date,
  last_invoice.invoice_number as last_invoice_number,
  last_invoice.id as last_invoice_id
from public.clients c
left join public.client_groups g on g.id = c.group_id
left join public.salespeople s on s.id = c.salesperson_id
left join public.payment_methods pm on pm.id = c.payment_method_id
left join lateral (
  select sum(greatest(i.total - i.amount_paid, 0)) as balance,
    min(i.due_date) filter (where i.total > i.amount_paid) as next_due_date
  from public.invoices i
  where i.client_id = c.id and i.status not in ('draft', 'void')
) summary on true
left join lateral (
  select i.id, i.invoice_number from public.invoices i
  where i.client_id = c.id and i.status not in ('draft', 'void')
  order by i.issue_date desc, i.created_at desc, i.id desc limit 1
) last_invoice on true;
revoke all on public.bbs_client_directory from anon;
grant select on public.bbs_client_directory to authenticated, service_role;


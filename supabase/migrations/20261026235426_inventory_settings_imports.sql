-- Inventory and effective document preferences. Existing catalogue remains unchanged.
alter table public.items
  add column manage_stock boolean not null default false,
  add column stock_quantity numeric(12,2) not null default 0,
  add column ideal_quantity numeric(12,2) not null default 0 check(ideal_quantity>=0),
  add column warning_quantity numeric(12,2) not null default 0 check(warning_quantity>=0),
  add column supplier text,
  add column private_notes text;
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references public.items(id) on delete restrict,
 invoice_id uuid references public.invoices(id) on delete restrict, quantity numeric(12,2) not null,
 reason text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index inventory_movements_item_date on public.inventory_movements(item_id,created_at);
create index inventory_movements_invoice on public.inventory_movements(invoice_id);
create index inventory_movements_actor on public.inventory_movements(created_by);
alter table public.inventory_movements enable row level security;
create policy inventory_admin on public.inventory_movements to authenticated using ((select bbs_private.is_admin())) with check ((select bbs_private.is_admin()));
grant select,insert on public.inventory_movements to authenticated;
revoke all on public.inventory_movements from anon;

alter table public.business_settings
 add column legal_name text,
 add column tax_id text,
 add column website text,
 add column document_preferences jsonb not null default '{}'::jsonb;

create or replace function public.save_catalog_item(p_item jsonb,p_id uuid default null,p_version timestamptz default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; old_row public.items%rowtype; v_stock numeric:=(p_item->>'stock_quantity')::numeric; v_manage boolean:=(p_item->>'manage_stock')::boolean; v_delta numeric;
begin
 if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
 if length(btrim(p_item->>'name')) not between 2 and 200 or (p_item->>'unit_price')::numeric<0 or (p_item->>'unit_price')::numeric<>round((p_item->>'unit_price')::numeric,2)
 or v_stock is null or v_stock<>round(v_stock,2) or (p_item->>'ideal_quantity')::numeric<0 or (p_item->>'warning_quantity')::numeric<0 then raise exception 'Revise los datos del artículo.'; end if;
 if nullif(p_item->>'sku','') is not null then
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sku:'||lower(btrim(p_item->>'sku')),0));
 if exists(select 1 from public.items where lower(btrim(sku))=lower(btrim(p_item->>'sku')) and id is distinct from p_id) then raise exception 'Ya existe un artículo con ese código.'; end if; end if;
 if p_id is not null then
 select * into old_row from public.items where id=p_id for update;
 if not found then raise exception 'Artículo no encontrado.'; end if;
 if p_version is null or old_row.updated_at is distinct from p_version then raise exception 'Otro usuario modificó el artículo. Recargue antes de guardar.'; end if;
 v_id:=p_id;
 else insert into public.items(name,created_by) values(btrim(p_item->>'name'),auth.uid()) returning id into v_id; end if;
 v_delta:=v_stock-coalesce(old_row.stock_quantity,0);
 update public.items set sku=nullif(btrim(p_item->>'sku'),''),name=btrim(p_item->>'name'),description=nullif(p_item->>'description',''),unit_price=(p_item->>'unit_price')::numeric,
 unit=coalesce(nullif(p_item->>'unit',''),'unidad'),is_active=(p_item->>'is_active')::boolean,tax_rate_id=nullif(p_item->>'tax_rate_id','')::uuid,
 manage_stock=v_manage,stock_quantity=v_stock,ideal_quantity=(p_item->>'ideal_quantity')::numeric,warning_quantity=(p_item->>'warning_quantity')::numeric,
 supplier=nullif(p_item->>'supplier',''),private_notes=nullif(p_item->>'private_notes','') where id=v_id;
 if v_delta<>0 then insert into public.inventory_movements(item_id,quantity,reason,created_by) values(v_id,v_delta,case when p_id is null then 'Existencias iniciales' else 'Ajuste manual de existencias' end,auth.uid()); end if;
 return v_id;
end $$;
revoke all on function public.save_catalog_item(jsonb,uuid,timestamptz) from public,anon;
grant execute on function public.save_catalog_item(jsonb,uuid,timestamptz) to authenticated;

-- Movement helper is invoked within the same invoice transaction, never on quotations.
create or replace function bbs_private.move_invoice_stock(p_item uuid,p_invoice uuid,p_quantity numeric,p_reason text) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if p_item is null or p_quantity=0 then return; end if;
 perform 1 from public.items where id=p_item and manage_stock for update;
 if not found then return; end if;
 update public.items set stock_quantity=stock_quantity+p_quantity where id=p_item;
 insert into public.inventory_movements(item_id,invoice_id,quantity,reason,created_by) values(p_item,p_invoice,p_quantity,p_reason,auth.uid());
end $$;
revoke all on function bbs_private.move_invoice_stock(uuid,uuid,numeric,text) from public,anon;
grant execute on function bbs_private.move_invoice_stock(uuid,uuid,numeric,text) to authenticated;

create or replace function bbs_private.invoice_stock_lines() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_status text; v_invoice uuid;
begin
 v_invoice:=case when TG_OP='DELETE' then old.invoice_id else new.invoice_id end;
 select status::text into v_status from public.invoices where id=v_invoice;
 if v_status not in ('draft','void') then
 if TG_OP in ('UPDATE','DELETE') then perform bbs_private.move_invoice_stock(old.item_id,v_invoice,old.quantity,'Línea de factura retirada'); end if;
 if TG_OP in ('UPDATE','INSERT') then perform bbs_private.move_invoice_stock(new.item_id,v_invoice,-new.quantity,'Línea de factura emitida'); end if;
 end if;
 return coalesce(new,old);
end $$;
create trigger invoice_stock_line_changes after insert or update or delete on public.invoice_items for each row execute function bbs_private.invoice_stock_lines();

create or replace function bbs_private.invoice_stock_status() returns trigger language plpgsql security invoker set search_path='' as $$
declare r record; v_direction integer;
begin
 if (old.status in ('draft','void'))=(new.status in ('draft','void')) then return new; end if;
 v_direction:=case when new.status in ('draft','void') then 1 else -1 end;
 for r in select item_id,sum(quantity) quantity from public.invoice_items where invoice_id=new.id and item_id is not null group by item_id order by item_id loop
 perform bbs_private.move_invoice_stock(r.item_id,new.id,r.quantity*v_direction,case when v_direction=1 then 'Factura anulada' else 'Factura emitida' end); end loop;
 return new;
end $$;
create trigger invoice_stock_status_changes after update of status on public.invoices for each row execute function bbs_private.invoice_stock_status();
revoke all on function bbs_private.invoice_stock_lines(),bbs_private.invoice_stock_status() from public,anon;

-- Respect configured invoice prefix while keeping the existing atomic number counter.
create or replace function public.set_invoice_number() returns trigger language plpgsql security definer set search_path='' as $$
declare v_prefix text;
begin
 if new.invoice_number is null or new.invoice_number='' then
 select invoice_prefix into v_prefix from public.business_settings limit 1;
 new.invoice_number:=bbs_private.issue_document_number('invoice',coalesce(v_prefix,'FAC'));
 end if; return new;
end $$;
revoke all on function public.set_invoice_number() from public,anon,authenticated;

create table public.import_batches (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('clients','items','quotes','invoices','credits')),
 file_name text not null,row_count integer not null,status text not null default 'completed' check(status in ('completed','reverted')),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),reverted_at timestamptz,
 request_id uuid not null,request_hash text not null,unique(created_by,request_id)
);
create table public.import_batch_rows (
 id uuid primary key default gen_random_uuid(),batch_id uuid not null references public.import_batches(id) on delete cascade,
 position integer not null,table_name text not null,record_id uuid not null,before_data jsonb,after_data jsonb not null,unique(batch_id,position)
);
create index import_batch_rows_batch on public.import_batch_rows(batch_id);
create index import_batches_actor on public.import_batches(created_by);
alter table public.import_batches enable row level security;
alter table public.import_batch_rows enable row level security;
create policy import_batches_admin on public.import_batches to authenticated using ((select bbs_private.is_admin())) with check ((select bbs_private.is_admin()));
create policy import_rows_admin on public.import_batch_rows to authenticated using ((select bbs_private.is_admin())) with check ((select bbs_private.is_admin()));
grant select,insert,update on public.import_batches to authenticated;
grant select,insert on public.import_batch_rows to authenticated;
revoke all on public.import_batches,public.import_batch_rows from anon;

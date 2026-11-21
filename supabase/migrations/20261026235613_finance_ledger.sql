-- Cash, credits and refunds have independent ledgers; only applications settle invoices.
alter table public.invoices add column amount_credited numeric(12,2) not null default 0,
  add column amount_paid_legacy numeric(12,2) not null default 0;
update public.invoices set amount_paid_legacy=amount_paid;
alter table public.payments add column client_name text not null default '',
  add column updated_at timestamptz not null default now(), add column finance_version smallint not null default 0,
  add column voided_at timestamptz, add column business_snapshot jsonb;
alter table public.credit_notes add column finance_version smallint not null default 0,
  add column document_snapshot jsonb;
alter table public.refunds add column credit_note_id uuid references public.credit_notes(id) on delete restrict,
  add column payment_method_id uuid references public.payment_methods(id) on delete restrict,
  add column reference text, add column client_name text not null default '',
  add column finance_version smallint not null default 0, add column business_snapshot jsonb;

create table public.finance_applications (
 id uuid primary key default gen_random_uuid(), source_kind text not null check(source_kind in ('payment','credit')),
 source_id uuid not null, invoice_id uuid not null references public.invoices(id) on delete restrict,
 client_id uuid not null references public.clients(id) on delete restrict,
 amount numeric(12,2) not null check(amount>0), created_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id), reversed_at timestamptz,
 reversed_by uuid references auth.users(id), reversal_reason text
);
create index finance_applications_source_idx on public.finance_applications(source_kind,source_id) where reversed_at is null;
create index finance_applications_invoice_idx on public.finance_applications(invoice_id) where reversed_at is null;
create index finance_applications_client_idx on public.finance_applications(client_id);
alter table public.refunds add column credit_application_id uuid references public.finance_applications(id) on delete restrict;

create table public.finance_requests (
 actor_id uuid not null references auth.users(id), request_id uuid not null, command_hash text not null,
 result_id uuid not null, created_at timestamptz not null default now(), primary key(actor_id,request_id)
);
create table public.finance_events (
 id uuid primary key default gen_random_uuid(), entity_kind text not null, entity_id uuid not null,
 event_type text not null, payload jsonb not null default '{}'::jsonb,
 actor_id uuid not null references auth.users(id), request_id uuid not null,
 created_at timestamptz not null default now()
);
create index finance_events_entity_idx on public.finance_events(entity_kind,entity_id,created_at);
create table public.credit_note_items (
 id uuid primary key default gen_random_uuid(), credit_note_id uuid not null references public.credit_notes(id) on delete restrict,
 position integer not null, item_id uuid references public.items(id) on delete restrict,
 description text not null, quantity numeric(12,2) not null, unit_price numeric(12,2) not null,
 tax_rate numeric(9,4) not null, discount_percent numeric(9,4) not null, sku text,
 gross_total numeric(12,2) not null, discount_total numeric(12,2) not null,
 net_total numeric(12,2) not null, tax_total numeric(12,2) not null, line_total numeric(12,2) not null,
 unique(credit_note_id,position)
);
create index credit_note_items_item_idx on public.credit_note_items(item_id);
create index refunds_credit_note_idx on public.refunds(credit_note_id);
create index refunds_credit_application_idx on public.refunds(credit_application_id);
create index payments_client_idx on public.payments(client_id);
create index refunds_payment_idx on public.refunds(payment_id);
create index refunds_method_idx on public.refunds(payment_method_id);

alter table public.finance_applications enable row level security;
alter table public.finance_requests enable row level security;
alter table public.finance_events enable row level security;
alter table public.credit_note_items enable row level security;
create policy finance_applications_read_admin on public.finance_applications for select to authenticated using(bbs_private.is_admin());
create policy finance_events_read_admin on public.finance_events for select to authenticated using(bbs_private.is_admin());
create policy credit_note_items_read_admin on public.credit_note_items for select to authenticated using(bbs_private.is_admin());
revoke all on public.finance_applications,public.finance_requests,public.finance_events,public.credit_note_items from anon,authenticated;
grant select on public.finance_applications,public.finance_events,public.credit_note_items to authenticated;
revoke insert,update,delete on public.payments,public.credit_notes,public.refunds from authenticated;

create or replace function bbs_private.finance_money(p_value numeric) returns numeric language plpgsql immutable set search_path='' as $fn$
begin
 if p_value is null or p_value::text in ('NaN','Infinity','-Infinity') or p_value<=0 or p_value>9999999999.99 or p_value<>round(p_value,2) then raise exception 'Importe inválido: use un valor positivo con dos decimales.'; end if;
 return p_value;
end $fn$;

create or replace function bbs_private.credit_totals(p jsonb) returns jsonb language plpgsql immutable set search_path='' as $fn$
declare items jsonb:=p->'items'; r jsonb; result jsonb:='[]'; gross numeric[]:='{}'; discounts numeric[]:='{}';
 subtotal numeric:=0; discount numeric:=0; tax numeric:=0; ship numeric:=(p->>'shipping_amount')::numeric*100;
 shiptax numeric; rate numeric; line_discount numeric; qty numeric; price numeric; net numeric; t numeric; total numeric;
 mode text:=p->>'discount_mode'; global_value numeric:=(p->>'discount_value')::numeric; exempt boolean:=(p->>'tax_exempt')::boolean;
 i integer; n integer; residual integer;
begin
 if jsonb_typeof(items) is distinct from 'array' then raise exception 'Agregue artículos.'; end if;
 n:=jsonb_array_length(items); if n<1 or n>300 then raise exception 'Agregue entre 1 y 300 artículos.'; end if;
 if mode not in ('none','fixed','percent','line') or mode is null or global_value is null or global_value<0 or global_value<>round(global_value,2) or (mode='percent' and global_value>100) then raise exception 'Descuento inválido.'; end if;
 if ship is null or ship<0 or ship<>round(ship) or exempt is null then raise exception 'Envío inválido.'; end if;
 rate:=(p->>'shipping_tax_rate')::numeric;
 if rate is null or rate<0 or rate>100 or rate<>round(rate,4) then raise exception 'Impuesto de envío inválido.'; end if;
 shiptax:=case when exempt then 0 else round(ship*rate/100) end;
 for i in 1..n loop
  r:=items->(i-1); qty:=(r->>'quantity')::numeric; price:=(r->>'unit_price')::numeric;
  rate:=(r->>'tax_rate')::numeric; line_discount:=(r->>'discount_percent')::numeric;
  if qty is null or qty<=0 or qty<>round(qty,2) or price is null or price<0 or price<>round(price,2) or coalesce(length(btrim(r->>'description')),0)<2 then raise exception 'Artículo inválido.'; end if;
  if rate is null or rate<0 or rate>100 or rate<>round(rate,4) or line_discount is null or line_discount<0 or line_discount>100 or line_discount<>round(line_discount,4) then raise exception 'Impuesto o descuento de artículo inválido.'; end if;
  gross[i]:=round(qty*price*100); discounts[i]:=case when mode='line' then round(gross[i]*line_discount/100) else 0 end; subtotal:=subtotal+gross[i];
 end loop;
 if mode in ('fixed','percent') then
  discount:=case when mode='fixed' then global_value*100 else round(subtotal*global_value/100) end;
  if discount>subtotal then raise exception 'El descuento no puede superar el subtotal.'; end if;
  if subtotal>0 then
   for i in 1..n loop discounts[i]:=floor(gross[i]*discount/subtotal); end loop;
   select (discount-sum(x))::integer into residual from unnest(discounts) x;
   for i in select s from generate_series(1,n) s order by mod(gross[s]*discount,subtotal) desc,s limit residual loop discounts[i]:=discounts[i]+1; end loop;
  end if;
 end if;
 select coalesce(sum(x),0) into discount from unnest(discounts) x;
 for i in 1..n loop
  r:=items->(i-1); net:=gross[i]-discounts[i]; t:=case when exempt then 0 else round(net*(r->>'tax_rate')::numeric/100) end; tax:=tax+t;
  result:=result||jsonb_build_array(r||jsonb_build_object('gross_total',gross[i]/100,'discount_total',discounts[i]/100,'net_total',net/100,'tax_total',t/100,'line_total',(net+t)/100));
 end loop;
 tax:=tax+shiptax; total:=subtotal-discount+ship+tax;
 if subtotal>999999999999 or total>999999999999 or total<=0 then raise exception 'Total de crédito inválido.'; end if;
 return jsonb_build_object('items',result,'subtotal',subtotal/100,'discount_total',discount/100,'net_subtotal',(subtotal-discount)/100,'shipping_amount',ship/100,'shipping_tax_total',shiptax/100,'tax_total',tax/100,'total',total/100);
end $fn$;

create or replace function bbs_private.finance_available(p_kind text,p_id uuid) returns numeric language sql stable set search_path='' as $fn$
 select case when p_kind='payment' then
  coalesce((select case when voided_at is null and status='completed' and finance_version=1 then amount else 0 end from public.payments where id=p_id),0)
  -coalesce((select sum(amount) from public.finance_applications where source_kind='payment' and source_id=p_id and reversed_at is null),0)
  -coalesce((select sum(amount) from public.refunds where payment_id=p_id and status='completed' and finance_version=1),0)
 else
  coalesce((select case when status='completed' and finance_version=1 then total else 0 end from public.credit_notes where id=p_id),0)
  -coalesce((select sum(amount) from public.finance_applications where source_kind='credit' and source_id=p_id and reversed_at is null),0)
  -coalesce((select sum(amount) from public.refunds where credit_note_id=p_id and status='completed' and credit_application_id is null and finance_version=1),0)
 end;
$fn$;

create or replace function bbs_private.finance_recalculate(p_invoice uuid) returns void language plpgsql set search_path='' as $fn$
declare paid numeric; credited numeric; i public.invoices%rowtype;
begin
 select * into i from public.invoices where id=p_invoice for update;
 select coalesce(sum(amount) filter(where source_kind='payment'),0)+i.amount_paid_legacy,coalesce(sum(amount) filter(where source_kind='credit'),0) into paid,credited from public.finance_applications where invoice_id=p_invoice and reversed_at is null;
 if paid+credited>i.total then raise exception 'El pago y crédito superan el total de la factura.'; end if;
 update public.invoices set amount_paid=paid,amount_credited=credited,status=case when status in ('draft','void') then status when paid+credited>=total then 'paid'::public.document_status when paid+credited>0 then 'partial'::public.document_status when due_date<current_date then 'overdue'::public.document_status else 'sent'::public.document_status end where id=p_invoice;
end $fn$;

create or replace function bbs_private.finance_allocate(p_kind text,p_source uuid,p_client uuid,p_allocations jsonb) returns uuid language plpgsql set search_path='' as $fn$
declare r jsonb; i public.invoices%rowtype; value numeric; allocated numeric:=0; available numeric; result uuid;
begin
 if jsonb_typeof(p_allocations) is distinct from 'array' or jsonb_array_length(p_allocations)>100 then raise exception 'Aplicaciones inválidas.'; end if;
 if (select count(*)<>count(distinct x->>'invoice_id') from jsonb_array_elements(p_allocations) x) then raise exception 'Factura repetida.'; end if;
 available:=bbs_private.finance_available(p_kind,p_source);
 for r in select x from jsonb_array_elements(p_allocations) x order by x->>'invoice_id' loop
  value:=bbs_private.finance_money((r->>'amount')::numeric);
  select * into i from public.invoices where id=(r->>'invoice_id')::uuid for update;
  if not found or i.client_id is distinct from p_client or i.status in ('draft','void') then raise exception 'Factura no válida para este cliente.'; end if;
  if value>i.total-i.amount_paid-i.amount_credited then raise exception 'La aplicación supera el saldo de la factura.'; end if;
  allocated:=allocated+value; if allocated>available then raise exception 'La aplicación supera el importe disponible.'; end if;
  insert into public.finance_applications(source_kind,source_id,invoice_id,client_id,amount,created_by) values(p_kind,p_source,i.id,p_client,value,auth.uid()) returning id into result;
  perform bbs_private.finance_recalculate(i.id);
 end loop;
 return result;
end $fn$;

create or replace function public.bbs_finance_command(p_command jsonb,p_request_id uuid) returns uuid language plpgsql security definer set search_path='' as $fn$
declare op text:=p_command->>'operation'; actor uuid:=auth.uid(); client uuid; result uuid; source uuid; kind text; doc jsonb; totals jsonb; business jsonb;
 payment public.payments%rowtype; credit public.credit_notes%rowtype; refund public.refunds%rowtype; app public.finance_applications%rowtype;
 inv public.invoices%rowtype; row jsonb; value numeric; remaining numeric; piece numeric; old_hash text; request_hash text:=md5(p_command::text); source_invoice uuid; app_id uuid; v_reason text:=btrim(p_command->>'reason');
begin
 if actor is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Falta identificación de solicitud.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_request_id::text,0));
 select command_hash,result_id into old_hash,result from public.finance_requests where actor_id=actor and request_id=p_request_id;
 if found then if old_hash<>request_hash then raise exception 'Solicitud reutilizada con otros datos.'; end if; return result; end if;
 if op in ('payment.create','refund.create') then client:=(p_command->>'client_id')::uuid;
 elsif op in ('payment.update','payment.void') then select client_id into client from public.payments where id=(p_command->>'id')::uuid;
 elsif op in ('credit.create','credit.update') then client:=(p_command->'document'->>'client_id')::uuid;
 elsif op='credit.void' then select client_id into client from public.credit_notes where id=(p_command->>'id')::uuid;
 elsif op='refund.void' then select client_id into client from public.refunds where id=(p_command->>'id')::uuid;
 elsif op='application.unapply' then select client_id into client from public.finance_applications where id=(p_command->>'application_id')::uuid;
 elsif op='application.apply' then
  if p_command->>'source_kind'='payment' then select client_id into client from public.payments where id=(p_command->>'source_id')::uuid;
  elsif p_command->>'source_kind'='credit' then select client_id into client from public.credit_notes where id=(p_command->>'source_id')::uuid; end if;
 else raise exception 'Operación financiera inválida.'; end if;
 if client is null or not exists(select 1 from public.clients where id=client) then raise exception 'Cliente no encontrado.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('finance-client:'||client::text,0));
 select jsonb_strip_nulls(to_jsonb(s)||jsonb_build_object('business_name',s.company_name,'legal_name',s.company_name)) into business from public.business_settings s limit 1;
 if op in ('payment.create','payment.update','refund.create') and ((p_command->>'date')::date is null or length(p_command->>'reference')>300) then raise exception 'Fecha o referencia inválida.'; end if;
 if op not in ('payment.create','payment.update','application.apply') and coalesce(length(v_reason),0)<2 then raise exception 'Indique el motivo.'; end if;
 if op='payment.create' then
  value:=bbs_private.finance_money((p_command->>'amount')::numeric);
  insert into public.payments(client_id,client_name,payment_method_id,payment_number,status,amount,paid_at,reference,notes,created_by,finance_version,business_snapshot)
   select client,c.name,nullif(p_command->>'payment_method_id','')::uuid,bbs_private.issue_document_number('payment','PAG'),'completed',value,(p_command->>'date')::date,nullif(p_command->>'reference',''),nullif(p_command->>'notes',''),actor,1,business from public.clients c where c.id=client and c.is_active returning id into result;
  if result is null then raise exception 'Active el cliente antes de registrar pagos.'; end if;
  perform bbs_private.finance_allocate('payment',result,client,p_command->'allocations');
 elsif op='payment.update' then
  select * into payment from public.payments where id=(p_command->>'id')::uuid for update;
  if payment.voided_at is not null or payment.finance_version<>1 then raise exception 'Pago no editable.'; end if;
  if payment.updated_at is distinct from (p_command->>'version')::timestamptz then raise exception 'Otro usuario modificó el pago. Recargue la página.'; end if;
  update public.payments set paid_at=(p_command->>'date')::date,payment_method_id=nullif(p_command->>'payment_method_id','')::uuid,reference=nullif(p_command->>'reference',''),notes=nullif(p_command->>'notes',''),updated_at=clock_timestamp() where id=payment.id;
  result:=payment.id;
 elsif op='payment.void' then
  select * into payment from public.payments where id=(p_command->>'id')::uuid for update;
  if payment.finance_version<>1 or payment.voided_at is not null or bbs_private.finance_available('payment',payment.id)<>payment.amount then raise exception 'Deshaga las aplicaciones y reembolsos antes de anular el pago.'; end if;
  update public.payments set voided_at=clock_timestamp(),status='failed',updated_at=clock_timestamp() where id=payment.id; result:=payment.id;
 elsif op in ('credit.create','credit.update') then
  doc:=p_command->'document'; totals:=bbs_private.credit_totals(doc); source_invoice:=nullif(p_command->>'source_invoice_id','')::uuid;
  if coalesce(length(btrim(doc->>'client_name')),0)<2 or coalesce(length(btrim(doc->>'seller_name')),0)<2 or (doc->>'issue_date')::date is null then raise exception 'Datos del crédito incompletos.'; end if;
  if op='credit.update' then
   select * into credit from public.credit_notes where id=(p_command->>'id')::uuid for update;
   if credit.client_id<>client or credit.finance_version<>1 or credit.status<>'completed' or bbs_private.finance_available('credit',credit.id)<>credit.total then raise exception 'Solo se puede editar un crédito sin aplicaciones ni reembolsos.'; end if;
   if credit.updated_at is distinct from (p_command->>'version')::timestamptz then raise exception 'Otro usuario modificó el crédito.'; end if;
   source_invoice:=credit.invoice_id; business:=credit.document_snapshot->'business_snapshot'; result:=credit.id;
   delete from public.credit_note_items where credit_note_id=result;
  else
   if not exists(select 1 from public.clients where id=client and is_active) then raise exception 'Active el cliente antes de emitir créditos.'; end if;
   if source_invoice is not null then
    select * into inv from public.invoices where id=source_invoice for update;
    if not found or inv.client_id is distinct from client or inv.status in ('draft','void') then raise exception 'Factura de origen inválida.'; end if;
    if (totals->>'total')::numeric+coalesce((select sum(total) from public.credit_notes where invoice_id=source_invoice and status='completed'),0)>inv.total then raise exception 'Los créditos superan el total de la factura de origen.'; end if;
    business:=coalesce(inv.business_snapshot,business);
   end if;
   insert into public.credit_notes(invoice_id,client_id,client_name,reason,status,issue_date,created_by,finance_version)
    values(source_invoice,client,doc->>'client_name',v_reason,'completed',(doc->>'issue_date')::date,actor,1) returning id into result;
  end if;
  if op='credit.update' and source_invoice is not null and (totals->>'total')::numeric+coalesce((select sum(total) from public.credit_notes where invoice_id=source_invoice and status='completed' and id<>result),0)>(select total from public.invoices where id=source_invoice) then raise exception 'Los créditos superan el total de la factura de origen.'; end if;
  for row in select x from jsonb_array_elements(totals->'items') x loop
   insert into public.credit_note_items(credit_note_id,position,item_id,description,quantity,unit_price,tax_rate,discount_percent,sku,gross_total,discount_total,net_total,tax_total,line_total)
    values(result,(select count(*) from public.credit_note_items where credit_note_id=result),nullif(row->>'item_id','')::uuid,row->>'description',(row->>'quantity')::numeric,(row->>'unit_price')::numeric,(row->>'tax_rate')::numeric,(row->>'discount_percent')::numeric,row->>'sku',(row->>'gross_total')::numeric,(row->>'discount_total')::numeric,(row->>'net_total')::numeric,(row->>'tax_total')::numeric,(row->>'line_total')::numeric);
  end loop;
  update public.credit_notes set reason=v_reason,client_name=doc->>'client_name',issue_date=(doc->>'issue_date')::date,subtotal=(totals->>'subtotal')::numeric,tax_total=(totals->>'tax_total')::numeric,total=(totals->>'total')::numeric,
   document_snapshot=doc||totals||jsonb_build_object('id',result,'number',credit_note_number,'kind','invoice','status','completed','due_date',doc->>'issue_date','amount_paid',0,'source_quote_id',null,'commercial_version',1,'business_snapshot',business,'created_at',created_at,'updated_at',clock_timestamp()) where id=result;
  if op='credit.create' then perform bbs_private.finance_allocate('credit',result,client,p_command->'allocations'); end if;
 elsif op='credit.void' then
  select * into credit from public.credit_notes where id=(p_command->>'id')::uuid for update;
  if credit.finance_version<>1 or credit.status<>'completed' or bbs_private.finance_available('credit',credit.id)<>credit.total then raise exception 'Deshaga las aplicaciones y reembolsos antes de anular el crédito.'; end if;
  update public.credit_notes set status='void' where id=credit.id; result:=credit.id;
 elsif op='application.apply' then
  kind:=p_command->>'source_kind'; source:=(p_command->>'source_id')::uuid;
  perform bbs_private.finance_allocate(kind,source,client,p_command->'allocations'); result:=source;
 elsif op='application.unapply' then
  select * into app from public.finance_applications where id=(p_command->>'application_id')::uuid for update;
  if app.reversed_at is not null then raise exception 'La aplicación ya fue deshecha.'; end if;
  if exists(select 1 from public.refunds where credit_application_id=app.id and status='completed') then raise exception 'Anule el reembolso para deshacer esta aplicación.'; end if;
  update public.finance_applications set reversed_at=clock_timestamp(),reversed_by=actor,reversal_reason=v_reason where id=app.id;
  perform bbs_private.finance_recalculate(app.invoice_id); result:=app.source_id;
 elsif op='refund.create' then
  value:=bbs_private.finance_money((p_command->>'amount')::numeric);
  select * into payment from public.payments where id=(p_command->>'payment_id')::uuid for update;
  if not found or payment.client_id<>client or payment.finance_version<>1 or payment.voided_at is not null or payment.status<>'completed' then raise exception 'Pago de origen inválido.'; end if;
  source:=nullif(p_command->>'credit_note_id','')::uuid;
  if source is not null then
   select * into credit from public.credit_notes where id=source for update;
   if not found or credit.client_id<>client or bbs_private.finance_available('credit',source)<value then raise exception 'Crédito no disponible para el reembolso.'; end if;
   if credit.invoice_id is not null then
    select * into inv from public.invoices where id=credit.invoice_id for update;
    if inv.status in ('draft','void') then raise exception 'Factura de origen no válida.'; end if;
    if coalesce((select sum(amount) from public.finance_applications where source_kind='payment' and source_id=payment.id and invoice_id=credit.invoice_id and reversed_at is null),0)<value then raise exception 'El pago no respalda ese importe en la factura del crédito.'; end if;
    remaining:=value;
    for app in select * from public.finance_applications where source_kind='payment' and source_id=payment.id and invoice_id=credit.invoice_id and reversed_at is null order by created_at,id for update loop
     exit when remaining=0; piece:=least(app.amount,remaining);
     update public.finance_applications set reversed_at=clock_timestamp(),reversed_by=actor,reversal_reason='Sustitución por crédito para reembolso' where id=app.id;
     if app.amount>piece then insert into public.finance_applications(source_kind,source_id,invoice_id,client_id,amount,created_by) values('payment',payment.id,credit.invoice_id,client,app.amount-piece,actor); end if;
     remaining:=remaining-piece;
    end loop;
    perform bbs_private.finance_recalculate(credit.invoice_id);
    app_id:=bbs_private.finance_allocate('credit',source,client,jsonb_build_array(jsonb_build_object('invoice_id',credit.invoice_id,'amount',value)));
   end if;
  end if;
  if bbs_private.finance_available('payment',payment.id)<value then raise exception 'El reembolso supera el efectivo disponible.'; end if;
  insert into public.refunds(payment_id,invoice_id,client_id,client_name,refund_number,status,amount,reason,refunded_at,created_by,credit_note_id,credit_application_id,payment_method_id,reference,finance_version,business_snapshot)
   values(payment.id,credit.invoice_id,client,payment.client_name,bbs_private.issue_document_number('refund','RE'),'completed',value,v_reason,(p_command->>'date')::date,actor,source,app_id,nullif(p_command->>'payment_method_id','')::uuid,nullif(p_command->>'reference',''),1,coalesce(credit.document_snapshot->'business_snapshot',business)) returning id into result;
 elsif op='refund.void' then
  select * into refund from public.refunds where id=(p_command->>'id')::uuid for update;
  if refund.finance_version<>1 or refund.status<>'completed' then raise exception 'Reembolso no anulable.'; end if;
  if refund.credit_application_id is not null then
   select * into app from public.finance_applications where id=refund.credit_application_id for update;
   if app.reversed_at is not null then raise exception 'La aplicación del reembolso ha cambiado.'; end if;
   update public.finance_applications set reversed_at=clock_timestamp(),reversed_by=actor,reversal_reason=v_reason where id=app.id;
   perform bbs_private.finance_recalculate(app.invoice_id);
  end if;
  update public.refunds set status='void' where id=refund.id;
  if refund.credit_application_id is not null then perform bbs_private.finance_allocate('payment',refund.payment_id,client,jsonb_build_array(jsonb_build_object('invoice_id',app.invoice_id,'amount',refund.amount))); end if;
  result:=refund.id;
 end if;
 if result is null then raise exception 'La operación no produjo un documento.'; end if;
 insert into public.finance_events(entity_kind,entity_id,event_type,payload,actor_id,request_id) values(split_part(op,'.',1),result,op,p_command,actor,p_request_id);
 insert into public.finance_requests(actor_id,request_id,command_hash,result_id) values(actor,p_request_id,request_hash,result);
 return result;
end $fn$;

revoke all on function public.bbs_finance_command(jsonb,uuid) from public,anon;
grant execute on function public.bbs_finance_command(jsonb,uuid) to authenticated;
revoke all on function bbs_private.finance_money(numeric),bbs_private.credit_totals(jsonb),bbs_private.finance_available(text,uuid),bbs_private.finance_recalculate(uuid),bbs_private.finance_allocate(text,uuid,uuid,jsonb) from public,anon,authenticated;

create or replace view public.bbs_client_directory with (security_invoker=true) as
select c.*,coalesce(g.name,'Predeterminado') group_name,s.name salesperson_name,pm.name payment_method_name,
 coalesce(summary.balance,0::numeric) balance,summary.next_due_date,last_invoice.invoice_number last_invoice_number,last_invoice.id last_invoice_id
from public.clients c left join public.client_groups g on g.id=c.group_id left join public.salespeople s on s.id=c.salesperson_id left join public.payment_methods pm on pm.id=c.payment_method_id
left join lateral(select sum(greatest(i.total-i.amount_paid-i.amount_credited,0)) balance,min(i.due_date) filter(where i.total>i.amount_paid+i.amount_credited) next_due_date from public.invoices i where i.client_id=c.id and i.status not in ('draft','void')) summary on true
left join lateral(select i.id,i.invoice_number from public.invoices i where i.client_id=c.id and i.status not in ('draft','void') order by i.issue_date desc,i.created_at desc,i.id desc limit 1) last_invoice on true;

-- Invoice financial amounts are maintained by the financial RPC only.
create or replace function bbs_private.protect_invoice_finance() returns trigger language plpgsql set search_path='' as $fn$
begin
 if current_user in ('authenticated','anon') and (new.amount_paid is distinct from old.amount_paid or new.amount_credited is distinct from old.amount_credited or new.amount_paid_legacy is distinct from old.amount_paid_legacy) then raise exception 'Use las operaciones de pago y crédito para modificar los saldos.'; end if;
 return new;
end $fn$;
create trigger invoices_protect_finance before update on public.invoices for each row execute function bbs_private.protect_invoice_finance();
-- The shared editor must also protect an invoice settled by credit.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean)'::regprocedure) into definition;
 if strpos(definition,'(v_existing->>''amount_paid'')::numeric > 0')=0 then raise exception 'Commercial editor payment guard not found.'; end if;
 execute replace(definition,'(v_existing->>''amount_paid'')::numeric > 0','((v_existing->>''amount_paid'')::numeric > 0 or coalesce((v_existing->>''amount_credited'')::numeric,0)>0)');
end $migration$;

-- Additive commercial snapshots. Existing rows retain version 0 and their original totals.
alter table public.quotes
  add column if not exists commercial_version smallint not null default 0 check (commercial_version in (0,1)),
  add column if not exists document_kind text not null default 'quote' check (document_kind in ('quote','estimate')),
  add column if not exists billing_address text,
  add column if not exists shipping_address text,
  add column if not exists payment_terms text not null default 'days' check (payment_terms in ('cod','days')),
  add column if not exists payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 3650),
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete restrict,
  add column if not exists payment_method_name text,
  add column if not exists tax_exempt boolean not null default false,
  add column if not exists private_notes text,
  add column if not exists footer_notes text,
  add column if not exists purchase_order text,
  add column if not exists project_description text,
  add column if not exists valid_until date,
  add column if not exists due_date date,
  add column if not exists discount_mode text not null default 'none' check (discount_mode in ('none','fixed','percent','line')),
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists discount_total numeric(12,2) not null default 0,
  add column if not exists net_subtotal numeric(12,2) not null default 0,
  add column if not exists tax_total numeric(12,2) not null default 0,
  add column if not exists shipping_amount numeric(12,2) not null default 0,
  add column if not exists shipping_tax_rate numeric(9,4) not null default 0,
  add column if not exists shipping_tax_total numeric(12,2) not null default 0,
  add column if not exists business_snapshot jsonb,
  add column if not exists emailed_at timestamptz,
  add column if not exists editor_request_id uuid,
  add column if not exists editor_request_hash text;
create unique index quotes_editor_request_unique on public.quotes(created_by, editor_request_id) where editor_request_id is not null;
alter table public.invoices
  add column if not exists commercial_version smallint not null default 0 check (commercial_version in (0,1)),
  add column if not exists document_kind text not null default 'quote' check (document_kind in ('quote','estimate')),
  add column if not exists billing_address text,
  add column if not exists shipping_address text,
  add column if not exists payment_terms text not null default 'days' check (payment_terms in ('cod','days')),
  add column if not exists payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 3650),
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete restrict,
  add column if not exists payment_method_name text,
  add column if not exists tax_exempt boolean not null default false,
  add column if not exists private_notes text,
  add column if not exists footer_notes text,
  add column if not exists purchase_order text,
  add column if not exists project_description text,
  add column if not exists valid_until date,
  add column if not exists due_date date,
  add column if not exists discount_mode text not null default 'none' check (discount_mode in ('none','fixed','percent','line')),
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists discount_total numeric(12,2) not null default 0,
  add column if not exists net_subtotal numeric(12,2) not null default 0,
  add column if not exists tax_total numeric(12,2) not null default 0,
  add column if not exists shipping_amount numeric(12,2) not null default 0,
  add column if not exists shipping_tax_rate numeric(9,4) not null default 0,
  add column if not exists shipping_tax_total numeric(12,2) not null default 0,
  add column if not exists business_snapshot jsonb,
  add column if not exists emailed_at timestamptz,
  add column if not exists editor_request_id uuid,
  add column if not exists editor_request_hash text;
create unique index invoices_editor_request_unique on public.invoices(created_by, editor_request_id) where editor_request_id is not null;
alter table public.quote_items
  add column if not exists commercial_tax_rate numeric(9,4) not null default 0,
  add column if not exists discount_percent numeric(9,4) not null default 0,
  add column if not exists sku_snapshot text,
  add column if not exists commercial_gross_total numeric(12,2) not null default 0,
  add column if not exists commercial_discount_total numeric(12,2) not null default 0,
  add column if not exists commercial_net_total numeric(12,2) not null default 0,
  add column if not exists commercial_tax_total numeric(12,2) not null default 0,
  add column if not exists commercial_line_total numeric(12,2) not null default 0;
alter table public.invoice_items
  add column if not exists commercial_tax_rate numeric(9,4) not null default 0,
  add column if not exists discount_percent numeric(9,4) not null default 0,
  add column if not exists sku_snapshot text,
  add column if not exists commercial_gross_total numeric(12,2) not null default 0,
  add column if not exists commercial_discount_total numeric(12,2) not null default 0,
  add column if not exists commercial_net_total numeric(12,2) not null default 0,
  add column if not exists commercial_tax_total numeric(12,2) not null default 0,
  add column if not exists commercial_line_total numeric(12,2) not null default 0;
alter table public.items add column if not exists tax_rate_id uuid references public.tax_rates(id) on delete restrict;
create index if not exists items_tax_rate_id_idx on public.items(tax_rate_id);
create index if not exists quotes_payment_method_id_idx on public.quotes(payment_method_id);
create index if not exists invoices_payment_method_id_idx on public.invoices(payment_method_id);
create unique index invoices_one_commercial_conversion on public.invoices(quote_id) where quote_id is not null and commercial_version=1 and status <> 'void';

create or replace function public.save_commercial_document(
  p_document jsonb, p_document_id uuid default null, p_expected_version timestamptz default null,
  p_request_id uuid default null, p_source_quote_id uuid default null, p_draft boolean default false
) returns uuid language plpgsql security invoker set search_path = '' as $function$
declare
  v_kind text := p_document->>'kind';
  v_table text;
  v_items_table text;
  v_foreign_key text;
  v_id uuid;
  v_existing jsonb;
  v_source jsonb;
  v_business jsonb;
  v_client_id uuid := nullif(p_document->>'client_id','')::uuid;
  v_item jsonb;
  v_items jsonb := p_document->'items';
  v_index integer;
  v_count integer;
  v_gross numeric[] := array[]::numeric[];
  v_discounts numeric[];
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_net numeric;
  v_tax numeric;
  v_tax_total numeric := 0;
  v_shipping numeric := (p_document->>'shipping_amount')::numeric * 100;
  v_shipping_tax numeric := 0;
  v_shipping_rate numeric := (p_document->>'shipping_tax_rate')::numeric;
  v_total numeric;
  v_global_value numeric := (p_document->>'discount_value')::numeric;
  v_mode text := p_document->>'discount_mode';
  v_exempt boolean := (p_document->>'tax_exempt')::boolean;
  v_issued date := (p_document->>'issue_date')::date;
  v_valid date := (p_document->>'valid_until')::date;
  v_terms text := p_document->>'payment_terms';
  v_days integer := (p_document->>'payment_terms_days')::integer;
  v_due date;
  v_residual integer;
  v_hash text := md5(p_document::text || coalesce(p_source_quote_id::text,'') || p_draft::text);
  v_method_name text := nullif(p_document->>'payment_method_name','');
  v_rate numeric;
  v_line_discount numeric;
  v_sku text;
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  if v_kind not in ('quote','invoice') or v_kind is null then raise exception 'Tipo de documento inválido.'; end if;
  v_table := case when v_kind='quote' then 'quotes' else 'invoices' end;
  v_items_table := case when v_kind='quote' then 'quote_items' else 'invoice_items' end;
  v_foreign_key := case when v_kind='quote' then 'quote_id' else 'invoice_id' end;
  if p_request_id is null then raise exception 'Falta identificación de solicitud.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text || v_kind || p_request_id::text,0));
  if p_document_id is null then
    execute format('select to_jsonb(d) from public.%I d where created_by=$1 and editor_request_id=$2',v_table) into v_existing using auth.uid(),p_request_id;
    if v_existing is not null then
      if v_existing->>'editor_request_hash' is distinct from v_hash then raise exception 'Solicitud reutilizada con otros datos. Recargue el formulario.'; end if;
      return (v_existing->>'id')::uuid;
    end if;
  else
    execute format('select to_jsonb(d) from public.%I d where id=$1 for update',v_table) into v_existing using p_document_id;
    if v_existing is null then raise exception 'Documento no encontrado.'; end if;
    if p_expected_version is null or (v_existing->>'updated_at')::timestamptz is distinct from p_expected_version then
      raise exception 'Otro usuario modificó el documento. Recargue antes de guardar.';
    end if;
    if v_kind='invoice' and ((v_existing->>'amount_paid')::numeric > 0 or v_existing->>'status' in ('paid','partial','void')) then
      raise exception 'Factura con pagos o anulada: no se pueden modificar sus importes.';
    end if;
    v_id := p_document_id;
  end if;
  if p_source_quote_id is not null then
    if v_kind <> 'invoice' then raise exception 'Origen inválido.'; end if;
    select to_jsonb(q) into v_source from public.quotes q where id=p_source_quote_id for update;
    if v_source is null then raise exception 'Cotización de origen no encontrada.'; end if;
    if p_document_id is null then
      select id into v_id from public.invoices where quote_id=p_source_quote_id and commercial_version=1 and status <> 'void';
      if v_id is not null then return v_id; end if;
    elsif (v_existing->>'quote_id')::uuid is distinct from p_source_quote_id then
      raise exception 'No se puede cambiar la cotización de origen.';
    end if;
  end if;
  if v_issued is null or v_valid is null or (v_kind='quote' and v_valid<v_issued) then raise exception 'Revise las fechas del documento.'; end if;
  if v_terms not in ('cod','days') or v_terms is null or v_days is null or v_days<0 or v_days>3650 then raise exception 'Condiciones de pago inválidas.'; end if;
  if v_terms='cod' then v_days:=0; end if;
  v_due := v_issued + v_days;
  if coalesce(length(btrim(p_document->>'client_name')),0) not between 2 and 200 or coalesce(length(btrim(p_document->>'seller_name')),0) not between 2 and 200 then raise exception 'Cliente y vendedor requeridos.'; end if;
  if v_client_id is not null then
    if not exists(select 1 from public.clients where id=v_client_id) then raise exception 'Cliente no encontrado.'; end if;
    if p_document_id is null and not exists(select 1 from public.clients where id=v_client_id and is_active) then raise exception 'Active el cliente antes de crear documentos.'; end if;
  end if;
  if coalesce(p_document->>'document_kind','quote') not in ('quote','estimate') then raise exception 'Clase de cotización inválida.'; end if;
  if v_mode not in ('none','fixed','percent','line') or v_mode is null or v_global_value is null or v_global_value::text in ('NaN','Infinity','-Infinity') or v_global_value<0 or v_global_value<>round(v_global_value,2)
    or (v_mode='percent' and v_global_value>100) then raise exception 'Descuento inválido.'; end if;
  if v_shipping is null or v_shipping<0 or v_shipping<>round(v_shipping) or v_shipping_rate is null or v_shipping_rate<0 or v_shipping_rate>100
    or v_shipping_rate<>round(v_shipping_rate,4) or v_exempt is null then raise exception 'Envío o impuesto inválido.'; end if;
  if jsonb_typeof(v_items) is distinct from 'array' then raise exception 'Agregue artículos.'; end if;
  v_count:=jsonb_array_length(v_items);
  if v_count<1 or v_count>300 then raise exception 'Agregue entre 1 y 300 artículos.'; end if;
  for v_index in 1..v_count loop
    v_item:=v_items->(v_index-1);
    if coalesce(length(btrim(v_item->>'description')),0) not between 2 and 5000
      or (v_item->>'quantity')::numeric is null or (v_item->>'quantity')::numeric<=0 or (v_item->>'quantity')::numeric<>round((v_item->>'quantity')::numeric,2)
      or (v_item->>'unit_price')::numeric is null or (v_item->>'unit_price')::numeric<0 or (v_item->>'unit_price')::numeric<>round((v_item->>'unit_price')::numeric,2)
      or (v_item->>'tax_rate')::numeric is null or (v_item->>'tax_rate')::numeric<0 or (v_item->>'tax_rate')::numeric>100 or (v_item->>'tax_rate')::numeric<>round((v_item->>'tax_rate')::numeric,4)
      or (v_item->>'discount_percent')::numeric is null or (v_item->>'discount_percent')::numeric<0 or (v_item->>'discount_percent')::numeric>100 or (v_item->>'discount_percent')::numeric<>round((v_item->>'discount_percent')::numeric,4) then
      raise exception 'Revise cantidad, precio, impuesto y descuento de cada artículo.';
    end if;
    v_gross:=array_append(v_gross,round((v_item->>'quantity')::numeric*(v_item->>'unit_price')::numeric*100));
    v_subtotal:=v_subtotal+v_gross[v_index];
  end loop;
  if v_subtotal>999999999999 then raise exception 'El subtotal supera el importe permitido.'; end if;
  v_discounts:=array_fill(0::numeric,array[v_count]);
  if v_mode='line' then
    for v_index in 1..v_count loop v_discounts[v_index]:=round(v_gross[v_index]*(v_items->(v_index-1)->>'discount_percent')::numeric/100); end loop;
  elsif v_mode in ('fixed','percent') then
    v_discount:=case when v_mode='fixed' then v_global_value*100 else round(v_subtotal*v_global_value/100) end;
    if v_discount>v_subtotal then raise exception 'El descuento no puede superar el subtotal.'; end if;
    if v_subtotal>0 then
      for v_index in 1..v_count loop v_discounts[v_index]:=floor(v_gross[v_index]*v_discount/v_subtotal); end loop;
      select (v_discount-sum(d))::integer into v_residual from unnest(v_discounts) as d;
      for v_index in select i from generate_subscripts(v_gross,1) as i order by mod(v_gross[i]*v_discount,v_subtotal) desc,i limit v_residual loop
        v_discounts[v_index]:=v_discounts[v_index]+1;
      end loop;
    end if;
  end if;
  select coalesce(sum(d),0) into v_discount from unnest(v_discounts) as d;
  select to_jsonb(s) into v_business from public.business_settings s limit 1;
  v_business:=coalesce(nullif(v_existing->'business_snapshot','null'::jsonb),jsonb_strip_nulls(coalesce(v_business,'{}'::jsonb) || jsonb_build_object('business_name',coalesce(v_business->>'company_name',v_business->>'business_name'),'legal_name',coalesce(v_business->>'company_name',v_business->>'business_name'))));
  if v_business='null'::jsonb then v_business:='{}'::jsonb; end if;
  if nullif(p_document->>'payment_method_id','') is not null then
    select coalesce(v_method_name,name) into v_method_name from public.payment_methods where id=(p_document->>'payment_method_id')::uuid;
    if not found then raise exception 'Método de pago no encontrado.'; end if;
  end if;
  if p_document_id is null then
    if v_kind='quote' then
      insert into public.quotes(client_id,client_name,client_email,seller_name,issue_date,valid_until,created_by,editor_request_id,editor_request_hash)
        values(v_client_id,btrim(p_document->>'client_name'),nullif(p_document->>'client_email',''),btrim(p_document->>'seller_name'),v_issued,v_valid,auth.uid(),p_request_id,v_hash) returning id into v_id;
    else
      insert into public.invoices(client_id,client_name,client_email,seller_name,issue_date,due_date,quote_id,created_by,editor_request_id,editor_request_hash)
        values(v_client_id,btrim(p_document->>'client_name'),nullif(p_document->>'client_email',''),btrim(p_document->>'seller_name'),v_issued,v_due,p_source_quote_id,auth.uid(),p_request_id,v_hash) returning id into v_id;
    end if;
  else
    execute format('delete from public.%I where %I=$1',v_items_table,v_foreign_key) using v_id;
  end if;
  perform set_config('bbs.commercial_save','1',true);
  for v_index in 1..v_count loop
    v_item:=v_items->(v_index-1); v_net:=v_gross[v_index]-v_discounts[v_index]; v_rate:=(v_item->>'tax_rate')::numeric;
    v_tax:=case when v_exempt then 0 else round(v_net*v_rate/100) end; v_tax_total:=v_tax_total+v_tax;
    v_sku:=nullif(v_item->>'sku','');
    if v_sku is null and nullif(v_item->>'item_id','') is not null then select sku into v_sku from public.items where id=(v_item->>'item_id')::uuid; end if;
    if v_kind='quote' then
      insert into public.quote_items(quote_id,item_id,description,quantity,unit_price,position,commercial_tax_rate,discount_percent,sku_snapshot,commercial_gross_total,commercial_discount_total,commercial_net_total,commercial_tax_total,commercial_line_total)
        values(v_id,nullif(v_item->>'item_id','')::uuid,btrim(v_item->>'description'),(v_item->>'quantity')::numeric,(v_item->>'unit_price')::numeric,v_index-1,v_rate,(v_item->>'discount_percent')::numeric,v_sku,v_gross[v_index]/100,v_discounts[v_index]/100,v_net/100,v_tax/100,(v_net+v_tax)/100);
    else
      insert into public.invoice_items(invoice_id,item_id,description,quantity,unit_price,tax_rate,position,commercial_tax_rate,discount_percent,sku_snapshot,commercial_gross_total,commercial_discount_total,commercial_net_total,commercial_tax_total,commercial_line_total)
        values(v_id,nullif(v_item->>'item_id','')::uuid,btrim(v_item->>'description'),(v_item->>'quantity')::numeric,(v_item->>'unit_price')::numeric,case when v_exempt then 0 else v_rate/100 end,v_index-1,v_rate,(v_item->>'discount_percent')::numeric,v_sku,v_gross[v_index]/100,v_discounts[v_index]/100,v_net/100,v_tax/100,(v_net+v_tax)/100);
    end if;
  end loop;
  v_shipping_tax:=case when v_exempt then 0 else round(v_shipping*v_shipping_rate/100) end;
  v_tax_total:=v_tax_total+v_shipping_tax; v_total:=v_subtotal-v_discount+v_shipping+v_tax_total;
  if v_total>999999999999 then raise exception 'El total supera el importe permitido.'; end if;
  execute format('update public.%I set client_id=$2,client_name=btrim($1->>''client_name''),client_email=nullif($1->>''client_email'',''''),seller_name=btrim($1->>''seller_name''),
    billing_address=nullif($1->>''billing_address'',''''),shipping_address=nullif($1->>''shipping_address'',''''),payment_terms=$1->>''payment_terms'',payment_terms_days=$3,
    payment_method_id=nullif($1->>''payment_method_id'','''')::uuid,payment_method_name=$4,tax_exempt=$5,issue_date=$6,valid_until=$7,due_date=$8,
    purchase_order=nullif($1->>''purchase_order'',''''),project_description=nullif($1->>''project_description'',''''),notes=nullif($1->>''public_notes'',''''),
    private_notes=nullif($1->>''private_notes'',''''),footer_notes=nullif($1->>''footer_notes'',''''),discount_mode=$1->>''discount_mode'',discount_value=($1->>''discount_value'')::numeric,
    shipping_amount=$9/100,shipping_tax_rate=($1->>''shipping_tax_rate'')::numeric,shipping_tax_total=$10/100,subtotal=$11/100,discount_total=$12/100,net_subtotal=($11-$12)/100,
    tax_total=$13/100,total=$14/100,business_snapshot=$15,commercial_version=1,document_kind=coalesce($1->>''document_kind'',''quote'') where id=$16',v_table)
    using p_document,v_client_id,v_days,v_method_name,v_exempt,v_issued,v_valid,v_due,v_shipping,v_shipping_tax,v_subtotal,v_discount,v_tax_total,v_total,v_business,v_id;
  if v_kind='invoice' then
    update public.invoices set status=case when p_draft then 'draft'::public.document_status when status='draft' then 'sent'::public.document_status else status end where id=v_id;
  end if;
  if v_kind='quote' then insert into public.quote_events(quote_id,actor_id,event_type,note) values(v_id,auth.uid(),case when p_document_id is null then 'created' else 'updated' end,'Documento comercial guardado.');
  else insert into public.document_events(document_type,document_id,actor_id,event_type,note) values('invoice',v_id,auth.uid(),case when p_document_id is null then 'created' else 'updated' end,'Factura guardada.'); end if;
  perform set_config('bbs.commercial_save','0',true);
  return v_id;
end;
$function$;
revoke all on function public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean) from public,anon;
grant execute on function public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean) to authenticated;

-- Prevent an old browser tab from replacing commercial totals through the legacy RPC.
do $migration$
declare definition text;
begin
  select pg_get_functiondef(p.oid) into definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='save_quote' and pg_get_function_identity_arguments(p.oid)='p_quote jsonb, p_items jsonb, p_quote_id uuid';
  if definition is not null then
    definition:=replace(definition, 'begin' || chr(10), 'begin' || chr(10) ||
      '  if p_quote_id is not null and exists(select 1 from public.quotes where id=p_quote_id and commercial_version=1) then raise exception ''Utilice el editor comercial para este documento.''; end if;' || chr(10));
    execute definition;
  end if;
end;
$migration$;


alter table public.invoices drop constraint if exists invoices_quote_id_fkey;
alter table public.invoices add constraint invoices_quote_id_fkey foreign key(quote_id) references public.quotes(id) on delete restrict;

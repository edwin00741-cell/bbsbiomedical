alter table public.recurring_invoices add column creation_signature text;
create or replace function public.create_invoice_recurrence(p_source_invoice_id uuid,p_name text,p_start_date date,p_end_date date,p_interval_unit text,p_interval_count integer,p_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_source public.invoices; v_payload jsonb; v_id uuid; v_items jsonb; v_previous text;
  v_signature text:=md5(jsonb_build_array(p_source_invoice_id,btrim(p_name),p_start_date,p_end_date,p_interval_unit,p_interval_count)::text);
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  if p_request_id is null then raise exception 'Falta identificar la solicitud.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('recurrence:'||p_request_id::text,0));
  select id,creation_signature into v_id,v_previous from public.recurring_invoices where id=p_request_id and created_by=auth.uid();
  if v_id is not null then
    if v_previous is distinct from v_signature then raise exception 'Solicitud reutilizada con otros datos. Recargue el formulario.'; end if;
    return v_id;
  end if;
  if length(btrim(p_name)) not between 2 and 160 or p_start_date is null or p_start_date < (now() at time zone 'America/Panama')::date
    or p_interval_unit not in ('days','weeks','months','years') or p_interval_unit is null or p_interval_count is null or p_interval_count not between 1 and 365
    or (p_end_date is not null and p_end_date<p_start_date) then raise exception 'Revise nombre, fechas e intervalo.'; end if;
  select * into v_source from public.invoices where id=p_source_invoice_id for share;
  if not found or v_source.status='void' then raise exception 'Factura de origen no disponible.'; end if;
  if v_source.commercial_version<>1 then raise exception 'Guarde esta factura con el editor comercial antes de programarla.'; end if;
  select jsonb_agg(jsonb_build_object('item_id',item_id,'sku',sku_snapshot,'description',description,'quantity',quantity,'unit_price',unit_price,
    'tax_rate',commercial_tax_rate,'discount_percent',discount_percent) order by position,id) into v_items from public.invoice_items where invoice_id=v_source.id;
  if jsonb_array_length(coalesce(v_items,'[]'::jsonb))=0 then raise exception 'La factura debe contener artículos.'; end if;
  v_payload:=to_jsonb(v_source)||jsonb_build_object('kind','invoice','public_notes',v_source.notes,'items',v_items);
  insert into public.recurring_invoices(id,name,source_invoice_id,document_snapshot,business_snapshot,interval_unit,interval_count,start_date,end_date,next_run_date,created_by,creation_signature)
    values(p_request_id,btrim(p_name),v_source.id,v_payload,v_source.business_snapshot,p_interval_unit,p_interval_count,p_start_date,p_end_date,p_start_date,auth.uid(),v_signature) returning id into v_id;
  insert into public.document_events(document_type,document_id,actor_id,event_type,note) values('recurrence',v_id,auth.uid(),'created','Plantilla recurrente creada desde '||v_source.invoice_number);
  return v_id;
end;
$$;
revoke all on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) from public,anon;
grant execute on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) to authenticated;

-- A credit issued from a sale must be reversed before that sale can be cancelled.
do $guard$
declare definition text;
begin
  select pg_get_functiondef('public.invoice_lifecycle_action(uuid,timestamp with time zone,text)'::regprocedure) into definition;
  if strpos(definition,$old$elsif p_action in ('void','delete_draft') then$old$)=0 then raise exception 'Lifecycle allocation guard not found.'; end if;
  execute replace(definition,$old$elsif p_action in ('void','delete_draft') then$old$,$new$elsif p_action in ('void','delete_draft') then
    if exists(select 1 from public.credit_notes where invoice_id=p_id and status::text='completed') then
      raise exception 'Esta factura tiene una nota de crédito emitida. Reviértala antes de anular la factura.';
    end if;$new$);
end;
$guard$;

-- Keep privileged implementations outside the exposed API schema; public RPCs only forward.
alter function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) set schema bbs_private;
alter function public.update_invoice_recurrence(uuid,timestamptz,text,date,text) set schema bbs_private;
create function public.create_invoice_recurrence(p_source_invoice_id uuid,p_name text,p_start_date date,p_end_date date,p_interval_unit text,p_interval_count integer,p_request_id uuid)
returns uuid language sql security invoker set search_path='' as $$
  select bbs_private.create_invoice_recurrence(p_source_invoice_id,p_name,p_start_date,p_end_date,p_interval_unit,p_interval_count,p_request_id);
$$;
create function public.update_invoice_recurrence(p_id uuid,p_version timestamptz,p_name text,p_end_date date,p_status text)
returns void language sql security invoker set search_path='' as $$
  select bbs_private.update_invoice_recurrence(p_id,p_version,p_name,p_end_date,p_status);
$$;
revoke all on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) from public,anon;
revoke all on function public.update_invoice_recurrence(uuid,timestamptz,text,date,text) from public,anon;
grant execute on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) to authenticated;
grant execute on function public.update_invoice_recurrence(uuid,timestamptz,text,date,text) to authenticated;

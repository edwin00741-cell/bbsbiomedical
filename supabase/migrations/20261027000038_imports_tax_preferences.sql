create function public.save_tax_definition(p_tax jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid:=nullif(p_tax->>'id','')::uuid; v_rate numeric:=(p_tax->>'percent')::numeric/100;
begin
 if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
 if coalesce(length(btrim(p_tax->>'name')),0) not between 2 and 100 or v_rate is null or v_rate<0 or v_rate>1 or v_rate<>round(v_rate,6) then raise exception 'Impuesto inválido.'; end if;
 if (p_tax->>'is_default')::boolean and not (p_tax->>'is_active')::boolean then raise exception 'El impuesto predeterminado debe estar activo.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('bbs-default-tax',0));
 if (p_tax->>'is_default')::boolean then update public.tax_rates set is_default=false where is_default; end if;
 if v_id is null then insert into public.tax_rates(name,rate,is_active,is_default) values(btrim(p_tax->>'name'),v_rate,(p_tax->>'is_active')::boolean,(p_tax->>'is_default')::boolean) returning id into v_id;
 else update public.tax_rates set name=btrim(p_tax->>'name'),rate=v_rate,is_active=(p_tax->>'is_active')::boolean,is_default=(p_tax->>'is_default')::boolean where id=v_id; if not found then raise exception 'Impuesto no encontrado.'; end if; end if;
 return v_id;
end $$;
revoke all on function public.save_tax_definition(jsonb) from public,anon;
grant execute on function public.save_tax_definition(jsonb) to authenticated;

create function public.import_commercial_batch(p_kind text,p_file_name text,p_rows jsonb,p_overwrite boolean,p_request_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_batch uuid;v_existing public.import_batches; v_row jsonb;v_before jsonb;v_after jsonb;v_id uuid;v_table text;v_position integer:=0;v_hash text:=md5(p_kind||p_rows::text||p_overwrite::text);v_version timestamptz;v_count integer;v_duplicate boolean;
begin
 if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
 if p_kind not in ('clients','items','quotes','invoices','credits') or p_request_id is null or jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'Lote de importación inválido (máximo 500 registros).'; end if;
 perform pg_advisory_xact_lock(hashtextextended('bbs-import:'||auth.uid()::text||p_request_id::text,0));
 select * into v_existing from public.import_batches where created_by=auth.uid() and request_id=p_request_id;
 if found then if v_existing.request_hash<>v_hash then raise exception 'Solicitud reutilizada con otro archivo.'; end if;return v_existing.id;end if;
 insert into public.import_batches(kind,file_name,row_count,created_by,request_id,request_hash) values(p_kind,left(p_file_name,200),jsonb_array_length(p_rows),auth.uid(),p_request_id,v_hash) returning id into v_batch;
 for v_row in select value from jsonb_array_elements(p_rows) loop
  v_before:=null;v_id:=null;v_position:=v_position+1;
  if p_kind='clients' then
   if coalesce(length(btrim(v_row->>'name')),0)<2 then raise exception 'Fila %: nombre de cliente requerido.',v_position;end if;
   select count(*) into v_count from public.clients where case when nullif(v_row->>'email','') is not null then lower(email)=lower(v_row->>'email') else lower(name)=lower(v_row->>'name') end;
   if v_count>1 then raise exception 'Fila %: cliente ambiguo; use un correo único.',v_position;end if;
   select to_jsonb(c),c.id into v_before,v_id from public.clients c where case when nullif(v_row->>'email','') is not null then lower(email)=lower(v_row->>'email') else lower(name)=lower(v_row->>'name') end for update;
   if v_id is not null and not p_overwrite then raise exception 'Fila %: cliente existente. Active sobrescribir o retire la fila.',v_position;end if;
   if v_id is null then insert into public.clients(name,created_by) values(v_row->>'name',auth.uid()) returning id into v_id;end if;
   update public.clients set name=v_row->>'name',email=nullif(v_row->>'email',''),phone=nullif(v_row->>'phone',''),contact_name=nullif(v_row->>'contact_name',''),address=nullif(v_row->>'address',''),shipping_address=nullif(v_row->>'shipping_address',''),notes=nullif(v_row->>'notes',''),public_notes=nullif(v_row->>'public_notes',''),statement_footer=nullif(v_row->>'statement_footer',''),payment_terms=coalesce(v_row->>'payment_terms','days'),payment_terms_days=coalesce((v_row->>'payment_terms_days')::integer,30),tax_exempt=coalesce((v_row->>'tax_exempt')::boolean,false),is_active=coalesce((v_row->>'is_active')::boolean,true) where id=v_id;
   v_table:='clients';
  elsif p_kind='items' then
   if nullif(v_row->>'sku','') is not null then select to_jsonb(i),i.id,i.updated_at into v_before,v_id,v_version from public.items i where lower(sku)=lower(v_row->>'sku') for update;end if;
   if v_id is not null and not p_overwrite then raise exception 'Fila %: código existente. Active sobrescribir o retire la fila.',v_position;end if;
   v_id:=public.save_catalog_item(v_row,v_id,v_version);v_table:='items';
  elsif p_kind in ('quotes','invoices') then
   v_table:=p_kind;
   if nullif(v_row->>'import_number','') is not null then
    execute format('select exists(select 1 from public.%I where %I=$1)',v_table,case when p_kind='quotes' then 'quote_number' else 'invoice_number' end) into v_duplicate using v_row->>'import_number';
    if v_duplicate then raise exception 'Fila %: número de documento ya existente.',v_position;end if;
   end if;
   v_id:=public.save_commercial_document(v_row,null,null,gen_random_uuid(),null,p_kind='invoices');
   if nullif(v_row->>'import_number','') is not null then execute format('update public.%I set %I=$1 where id=$2',v_table,case when p_kind='quotes' then 'quote_number' else 'invoice_number' end) using v_row->>'import_number',v_id;end if;
  else
   v_table:='credit_notes';v_id:=public.bbs_finance_command(jsonb_build_object('operation','credit.create','document',v_row,'source_invoice_id',null,'reason',coalesce(nullif(v_row->>'import_reason',''),'Crédito importado'),'allocations','[]'::jsonb),gen_random_uuid());
  end if;
  execute format('select to_jsonb(r) from public.%I r where id=$1',v_table) into v_after using v_id;
  insert into public.import_batch_rows(batch_id,position,table_name,record_id,before_data,after_data) values(v_batch,v_position,v_table,v_id,v_before,v_after);
 end loop;
 return v_batch;
end $$;
revoke all on function public.import_commercial_batch(text,text,jsonb,boolean,uuid) from public,anon;
grant execute on function public.import_commercial_batch(text,text,jsonb,boolean,uuid) to authenticated;

create function public.undo_commercial_import(p_batch uuid) returns void language plpgsql security invoker set search_path='' as $$
declare b public.import_batches;r public.import_batch_rows;v_current jsonb;v_version timestamptz;
begin
 if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501';end if;
 select * into b from public.import_batches where id=p_batch for update;
 if not found or b.status<>'completed' then raise exception 'Lote no disponible para deshacer.';end if;
 for r in select * from public.import_batch_rows where batch_id=p_batch order by position desc loop
  execute format('select to_jsonb(t) from public.%I t where id=$1 for update',r.table_name) into v_current using r.record_id;
  if v_current is distinct from r.after_data then raise exception 'El registro de la fila % cambió después de importar. No se deshizo el lote.',r.position;end if;
  if r.table_name='clients' then
   if r.before_data is null then delete from public.clients where id=r.record_id;
   else update public.clients set name=r.before_data->>'name',email=r.before_data->>'email',phone=r.before_data->>'phone',contact_name=r.before_data->>'contact_name',address=r.before_data->>'address',shipping_address=r.before_data->>'shipping_address',notes=r.before_data->>'notes',public_notes=r.before_data->>'public_notes',statement_footer=r.before_data->>'statement_footer',payment_terms=r.before_data->>'payment_terms',payment_terms_days=(r.before_data->>'payment_terms_days')::integer,tax_exempt=(r.before_data->>'tax_exempt')::boolean,is_active=(r.before_data->>'is_active')::boolean where id=r.record_id;end if;
  elsif r.table_name='items' then
   if r.before_data is null then
    if exists(select 1 from public.quote_items where item_id=r.record_id) or exists(select 1 from public.invoice_items where item_id=r.record_id) or exists(select 1 from public.credit_note_items where item_id=r.record_id) then raise exception 'Un documento utiliza el artículo de la fila %.',r.position;end if;
    -- Archive instead of removing inventory history.
    perform public.save_catalog_item(r.after_data||jsonb_build_object('is_active',false,'stock_quantity',0),r.record_id,(v_current->>'updated_at')::timestamptz);
   else perform public.save_catalog_item(r.before_data,r.record_id,(v_current->>'updated_at')::timestamptz);end if;
  elsif r.table_name='quotes' then delete from public.quotes where id=r.record_id;
  elsif r.table_name='invoices' then perform public.invoice_lifecycle_action(r.record_id,(v_current->>'updated_at')::timestamptz,'delete_draft');
  else perform public.bbs_finance_command(jsonb_build_object('operation','credit.void','id',r.record_id,'reason','Importación deshecha'),gen_random_uuid());end if;
 end loop;
 update public.import_batches set status='reverted',reverted_at=clock_timestamp() where id=p_batch;
end $$;
revoke all on function public.undo_commercial_import(uuid) from public,anon;
grant execute on function public.undo_commercial_import(uuid) to authenticated;

-- Legal name is stored independently from the commercial name in every new snapshot.
do $fix$
declare d text;
begin
 select pg_get_functiondef('public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean)'::regprocedure) into d;
 d:=replace(d,'''legal_name'',coalesce(v_business->>''company_name'',v_business->>''business_name'')','''legal_name'',coalesce(v_business->>''legal_name'',v_business->>''company_name'',v_business->>''business_name'')');execute d;
 select pg_get_functiondef('public.bbs_finance_command(jsonb,uuid)'::regprocedure) into d;
 d:=replace(d,'''legal_name'',s.company_name','''legal_name'',coalesce(s.legal_name,s.company_name)');execute d;
end $fix$;

create or replace function public.set_invoice_number() returns trigger language plpgsql security definer set search_path='' as $$
declare v_prefix text;
begin
 if new.invoice_number is null or new.invoice_number='' then
 select invoice_prefix into v_prefix from public.business_settings limit 1;
 loop new.invoice_number:=bbs_private.issue_document_number('invoice',coalesce(v_prefix,'FAC'));
 exit when not exists(select 1 from public.invoices where invoice_number=new.invoice_number);end loop;
 end if;return new;
end $$;
create or replace function public.set_quote_number() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.quote_number is null or new.quote_number='' then
 loop new.quote_number:=bbs_private.issue_quote_number();exit when not exists(select 1 from public.quotes where quote_number=new.quote_number);end loop;
 end if;return new;
end $$;
revoke all on function public.set_invoice_number(),public.set_quote_number() from public,anon,authenticated;

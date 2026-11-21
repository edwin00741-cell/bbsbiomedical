-- Calendar templates contain an immutable commercial snapshot; runs create normal invoices only.
create table public.recurring_invoices (
  id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 2 and 160),
  source_invoice_id uuid not null references public.invoices(id) on delete restrict,
  document_snapshot jsonb not null, business_snapshot jsonb,
  interval_unit text not null check(interval_unit in ('days','weeks','months','years')),
  interval_count integer not null check(interval_count between 1 and 365),
  start_date date not null, end_date date, next_run_date date not null,
  run_count integer not null default 0 check(run_count>=0), status text not null default 'active' check(status in ('active','paused','completed')),
  last_error text, last_run_at timestamptz, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(end_date is null or end_date>=start_date)
);
create index recurring_invoices_due_idx on public.recurring_invoices(next_run_date) where status='active';
create index recurring_invoices_source_idx on public.recurring_invoices(source_invoice_id);
create table public.recurring_invoice_runs (
  id uuid primary key default gen_random_uuid(), recurrence_id uuid not null references public.recurring_invoices(id) on delete restrict,
  scheduled_date date not null, invoice_id uuid not null references public.invoices(id) on delete restrict,
  created_at timestamptz not null default now(), unique(recurrence_id,scheduled_date), unique(invoice_id)
);
create table public.recurrence_scheduler_state (
  id boolean primary key default true check(id), installed boolean not null default false,
  last_run_at timestamptz, installation_error text
);
insert into public.recurrence_scheduler_state(id) values(true);
alter table public.recurring_invoices enable row level security;
alter table public.recurring_invoice_runs enable row level security;
alter table public.recurrence_scheduler_state enable row level security;
create policy recurring_invoices_admin_read on public.recurring_invoices for select to authenticated using(bbs_private.is_admin());
create policy recurring_runs_admin_read on public.recurring_invoice_runs for select to authenticated using(bbs_private.is_admin());
create policy recurrence_scheduler_admin_read on public.recurrence_scheduler_state for select to authenticated using(bbs_private.is_admin());
grant select on public.recurring_invoices,public.recurring_invoice_runs,public.recurrence_scheduler_state to authenticated;
revoke insert,update,delete on public.recurring_invoices,public.recurring_invoice_runs,public.recurrence_scheduler_state from anon,authenticated;

-- Anchor-based arithmetic: January 31 -> February 28 -> March 31, including leap years.
create function bbs_private.recurrence_date(p_start date,p_unit text,p_interval integer,p_occurrence integer)
returns date language sql immutable strict set search_path='' as $$
  select case p_unit
    when 'days' then p_start + p_interval*p_occurrence
    when 'weeks' then p_start + 7*p_interval*p_occurrence
    when 'months' then (p_start + make_interval(months=>p_interval*p_occurrence))::date
    when 'years' then (p_start + make_interval(years=>p_interval*p_occurrence))::date end;
$$;
revoke all on function bbs_private.recurrence_date(date,text,integer,integer) from public,anon,authenticated;

create function public.create_invoice_recurrence(p_source_invoice_id uuid,p_name text,p_start_date date,p_end_date date,p_interval_unit text,p_interval_count integer,p_request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_source public.invoices; v_payload jsonb; v_id uuid; v_items jsonb;
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  if p_request_id is null then raise exception 'Falta identificar la solicitud.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('recurrence:'||p_request_id::text,0));
  select id into v_id from public.recurring_invoices where id=p_request_id and created_by=auth.uid();
  if v_id is not null then return v_id; end if;
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
  insert into public.recurring_invoices(id,name,source_invoice_id,document_snapshot,business_snapshot,interval_unit,interval_count,start_date,end_date,next_run_date,created_by)
    values(p_request_id,btrim(p_name),v_source.id,v_payload,v_source.business_snapshot,p_interval_unit,p_interval_count,p_start_date,p_end_date,p_start_date,auth.uid()) returning id into v_id;
  insert into public.document_events(document_type,document_id,actor_id,event_type,note) values('recurrence',v_id,auth.uid(),'created','Plantilla recurrente creada desde '||v_source.invoice_number);
  return v_id;
end;
$$;
revoke all on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) from public,anon;
grant execute on function public.create_invoice_recurrence(uuid,text,date,date,text,integer,uuid) to authenticated;

create function public.update_invoice_recurrence(p_id uuid,p_version timestamptz,p_name text,p_end_date date,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare v_row public.recurring_invoices;
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  select * into v_row from public.recurring_invoices where id=p_id for update;
  if not found then raise exception 'Plantilla no encontrada.'; end if;
  if v_row.updated_at is distinct from p_version then raise exception 'Otro usuario modificó la programación. Recargue antes de guardar.'; end if;
  if length(btrim(p_name)) not between 2 and 160 or p_status not in ('active','paused') or p_status is null
    or (p_end_date is not null and p_end_date<v_row.start_date) then raise exception 'Revise nombre, estado y fecha final.'; end if;
  if p_status='active' and p_end_date is not null and p_end_date<v_row.next_run_date then raise exception 'La fecha final debe incluir la próxima emisión.'; end if;
  update public.recurring_invoices set name=btrim(p_name),end_date=p_end_date,status=p_status,last_error=null,updated_at=clock_timestamp() where id=p_id;
end;
$$;
revoke all on function public.update_invoice_recurrence(uuid,timestamptz,text,date,text) from public,anon;
grant execute on function public.update_invoice_recurrence(uuid,timestamptz,text,date,text) to authenticated;

-- Only this bounded private runner may impersonate a template's still-active administrator.
-- It cannot accept a date, arbitrary payload, actor or individual invoice ID from the caller.
create function bbs_private.run_due_invoice_recurrences(p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.recurring_invoices; v_id uuid; v_request uuid; v_payload jsonb; v_next date; v_i integer;
  v_today date:=(now() at time zone 'America/Panama')::date; v_claims text:=current_setting('request.jwt.claims',true);
  v_sub text:=current_setting('request.jwt.claim.sub',true); v_generated integer:=0; v_failed integer:=0;
begin
  if auth.uid() is not null then
    if not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  elsif session_user not in ('postgres','supabase_admin') then raise exception 'No autorizado.' using errcode='42501'; end if;
  for v_i in 1..least(greatest(coalesce(p_limit,25),1),50) loop
    select * into v_row from public.recurring_invoices where status='active' and next_run_date<=v_today order by next_run_date,id limit 1 for update skip locked;
    exit when not found;
    begin
      if v_row.end_date is not null and v_row.next_run_date>v_row.end_date then
        update public.recurring_invoices set status='completed',updated_at=clock_timestamp() where id=v_row.id; continue;
      end if;
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_row.created_by,'role','authenticated')::text,true);
      perform set_config('request.jwt.claim.sub',v_row.created_by::text,true);
      if not bbs_private.is_admin() then raise exception 'El administrador responsable ya no está activo.'; end if;
      v_request:=md5(v_row.id::text||':'||v_row.next_run_date::text)::uuid;
      v_payload:=v_row.document_snapshot || jsonb_build_object('kind','invoice','issue_date',v_row.next_run_date,'valid_until',v_row.next_run_date);
      v_id:=public.save_commercial_document(v_payload,null,null,v_request,null,false);
      update public.invoices set business_snapshot=v_row.business_snapshot where id=v_id;
      insert into public.recurring_invoice_runs(recurrence_id,scheduled_date,invoice_id) values(v_row.id,v_row.next_run_date,v_id) on conflict(recurrence_id,scheduled_date) do nothing;
      v_next:=bbs_private.recurrence_date(v_row.start_date,v_row.interval_unit,v_row.interval_count,v_row.run_count+1);
      update public.recurring_invoices set next_run_date=v_next,run_count=run_count+1,last_run_at=clock_timestamp(),last_error=null,
        status=case when end_date is not null and v_next>end_date then 'completed' else 'active' end,updated_at=clock_timestamp() where id=v_row.id;
      insert into public.document_events(document_type,document_id,actor_id,event_type,note) values('invoice',v_id,v_row.created_by,'recurring_generated','Emisión automática de plantilla '||v_row.id::text);
      v_generated:=v_generated+1;
    exception when others then
      update public.recurring_invoices set status='paused',last_error=left(sqlerrm,1000),updated_at=clock_timestamp() where id=v_row.id;
      v_failed:=v_failed+1;
    end;
    perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
    perform set_config('request.jwt.claim.sub',coalesce(v_sub,''),true);
  end loop;
  perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
  perform set_config('request.jwt.claim.sub',coalesce(v_sub,''),true);
  update public.recurrence_scheduler_state set last_run_at=clock_timestamp() where id;
  return jsonb_build_object('generated',v_generated,'failed',v_failed);
end;
$$;
revoke all on function bbs_private.run_due_invoice_recurrences(integer) from public,anon;
grant execute on function bbs_private.run_due_invoice_recurrences(integer) to authenticated;
create function public.run_due_invoice_recurrences() returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  return bbs_private.run_due_invoice_recurrences(25);
end;
$$;
revoke all on function public.run_due_invoice_recurrences() from public,anon;
grant execute on function public.run_due_invoice_recurrences() to authenticated;

create function public.invoice_lifecycle_action(p_id uuid,p_version timestamptz,p_action text) returns void
language plpgsql security invoker set search_path='' as $$
declare v_row public.invoices; v_allocated boolean:=false;
begin
  if auth.uid() is null or not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
  select * into v_row from public.invoices where id=p_id for update;
  if not found then raise exception 'Factura no encontrada.'; end if;
  if v_row.updated_at is distinct from p_version then raise exception 'Otro usuario modificó la factura. Recargue antes de continuar.'; end if;
  if p_action='mark_emailed' then
    if v_row.status in ('draft','void') then raise exception 'Emita una factura activa antes de registrar su envío.'; end if;
    update public.invoices set emailed_at=coalesce(emailed_at,now()) where id=p_id;
  elsif p_action in ('void','delete_draft') then
    if to_regclass('public.finance_applications') is not null then
      execute 'select exists(select 1 from public.finance_applications where invoice_id=$1 and reversed_at is null)' into v_allocated using p_id;
    end if;
    if v_row.amount_paid>0 or coalesce((to_jsonb(v_row)->>'amount_credited')::numeric,0)>0 or v_allocated or v_row.status in ('paid','partial') then
      raise exception 'La factura tiene pagos o créditos aplicados. Revierta las aplicaciones antes de continuar.';
    end if;
    if p_action='delete_draft' then
      if v_row.status<>'draft' then raise exception 'Solo se pueden borrar borradores. Anule las facturas emitidas.'; end if;
      if exists(select 1 from public.recurring_invoices where source_invoice_id=p_id) then raise exception 'Una plantilla recurrente conserva esta factura de origen.'; end if;
      delete from public.invoices where id=p_id;
    else
      if v_row.status='draft' then raise exception 'Puede borrar este borrador sin anularlo.'; end if;
      update public.invoices set status='void' where id=p_id;
    end if;
  else raise exception 'Acción inválida.'; end if;
  insert into public.document_events(document_type,document_id,actor_id,event_type,note) values('invoice',p_id,auth.uid(),p_action,
    case p_action when 'mark_emailed' then 'Envío registrado manualmente; no se envió correo desde esta acción.' when 'void' then 'Factura anulada.' else 'Borrador eliminado.' end);
end;
$$;
revoke all on function public.invoice_lifecycle_action(uuid,timestamptz,text) from public,anon;
grant execute on function public.invoice_lifecycle_action(uuid,timestamptz,text) to authenticated;

-- pg_cron executes locally in Postgres: no API key, HTTP endpoint, email or payment is involved.
do $installation$
begin
  if not exists(select 1 from pg_available_extensions where name='pg_cron') then
    update public.recurrence_scheduler_state set installation_error='pg_cron no está disponible. Puede ejecutar las emisiones pendientes manualmente.' where id;
    return;
  end if;
  begin
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('bbs-recurring-invoices','*/15 * * * *','select bbs_private.run_due_invoice_recurrences(25);');
    update public.recurrence_scheduler_state set installed=true,installation_error=null where id;
  exception when others then
    update public.recurrence_scheduler_state set installation_error=left(sqlerrm,1000) where id;
  end;
end;
$installation$;

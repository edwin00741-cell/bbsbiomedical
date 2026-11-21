-- Reunión 2026-11-21. Additive modules; no commercial records are deleted.
-- Reviewed SQL draft: the Supabase CLI is unavailable on this host.
create table public.work_sheets (
 id uuid primary key default gen_random_uuid(), number text unique not null,
 client_id uuid not null references public.clients(id) on delete restrict,
 client_name text not null, payload jsonb not null, request_id uuid not null,
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(created_by,request_id)
);
create table public.equipment (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete restrict,
 description text not null check(length(description) between 2 and 500), serial_number text not null default '',
 model text not null default '', brand text not null default '', asset_number text not null default '',
 department text not null default '', address text not null default '',
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.service_reports (
 id uuid primary key default gen_random_uuid(), number text not null unique,
 equipment_id uuid not null references public.equipment(id) on delete restrict,
 payload jsonb not null, equipment_snapshot jsonb not null, next_due_date date, status text not null check(status in ('programado','en_proceso','completado','cancelado')),
 request_id uuid not null, created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(created_by,request_id)
);
create table public.service_attachments (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.service_reports(id) on delete restrict,
 name text not null, path text not null unique, created_at timestamptz not null default now(), created_by uuid not null default auth.uid()
);
create table public.document_templates (
 id uuid primary key default gen_random_uuid(), name text not null, path text not null unique,
 created_at timestamptz not null default now(), created_by uuid not null default auth.uid()
);
create table public.service_reminders (
 report_id uuid not null references public.service_reports(id), due_date date not null,
 created_at timestamptz not null default now(), primary key(report_id,due_date)
);
create table bbs_private.module_counters (kind text not null, year integer not null, last_number integer not null, primary key(kind,year));
create index work_sheets_client_idx on public.work_sheets(client_id);
create index equipment_client_idx on public.equipment(client_id);
create index service_reports_equipment_idx on public.service_reports(equipment_id);
create index service_reports_due_idx on public.service_reports(next_due_date) where status='completado';
create index service_attachments_report_idx on public.service_attachments(report_id);
alter table public.quotes add column source_worksheet_number text;
alter table public.quotes add column source_worksheet_id uuid references public.work_sheets(id) on delete restrict;
create index quotes_source_worksheet_idx on public.quotes(source_worksheet_id);

create function bbs_private.next_module_number(p_kind text) returns text language plpgsql security definer set search_path='' as $$
declare n integer; y integer:=extract(year from now() at time zone 'America/Panama');
begin
 if not bbs_private.is_admin() or p_kind not in ('HT','SR') then raise exception 'No autorizado.' using errcode='42501'; end if;
 insert into bbs_private.module_counters values(p_kind,y,1) on conflict(kind,year) do update set last_number=module_counters.last_number+1 returning last_number into n;
 return p_kind||'-'||lpad(n::text,4,'0')||'-'||y;
end $$;
create function bbs_private.can_templates() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and username='bryanrodriguez' and is_active and not must_change_password);
$$;
revoke all on function bbs_private.next_module_number(text),bbs_private.can_templates() from public,anon;
grant execute on function bbs_private.next_module_number(text),bbs_private.can_templates() to authenticated;

alter table public.work_sheets enable row level security;
alter table public.equipment enable row level security;
alter table public.service_reports enable row level security;
alter table public.service_attachments enable row level security;
alter table public.document_templates enable row level security;
alter table public.service_reminders enable row level security;
create policy worksheet_read on public.work_sheets for select to authenticated using((select bbs_private.can_quote()));
create policy worksheet_admin on public.work_sheets for all to authenticated using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()));
create policy equipment_admin on public.equipment for all to authenticated using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()));
create policy service_admin on public.service_reports for all to authenticated using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()));
create policy attachments_admin on public.service_attachments for all to authenticated using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()));
create policy templates_bryan on public.document_templates for all to authenticated using((select bbs_private.can_templates())) with check((select bbs_private.can_templates()));
create policy reminders_admin on public.service_reminders for select to authenticated using((select bbs_private.is_admin()));
grant select,insert,update on public.work_sheets,public.equipment,public.service_reports,public.service_attachments,public.document_templates to authenticated;
grant select on public.service_reminders to authenticated;
revoke all on public.work_sheets,public.equipment,public.service_reports,public.service_attachments,public.document_templates,public.service_reminders from anon;

create function public.save_work_sheet(p_payload jsonb,p_request_id uuid,p_id uuid default null,p_version timestamptz default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_client text; v_item jsonb; v_key text; v numeric; v_old public.work_sheets;
begin
 if not bbs_private.is_admin() then raise exception 'Solo los administradores pueden editar hojas de trabajo.' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Falta solicitud.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request_id::text,0));
 if p_id is null then
  select * into v_old from public.work_sheets where created_by=auth.uid() and request_id=p_request_id;
  if found then if v_old.payload<>p_payload then raise exception 'Solicitud ya utilizada.'; end if; return v_old.id; end if;
 else
  perform pg_advisory_xact_lock(hashtextextended('worksheet:'||p_id::text,0));
  select * into v_old from public.work_sheets where id=p_id for update;
  if not found or p_version is distinct from v_old.updated_at then raise exception 'La hoja cambió. Recargue antes de guardar.'; end if;
 end if;
 select name into v_client from public.clients where id=(p_payload->>'client_id')::uuid and is_active;
 if not found then raise exception 'Seleccione un cliente activo.'; end if;
 if coalesce(length(btrim(p_payload->>'title')),0) not between 2 and 200 or coalesce(length(btrim(p_payload->>'seller_name')),0) not between 2 and 200 then raise exception 'Título y vendedor requeridos.'; end if;
 if (p_payload->>'issue_date')::date is null or coalesce(length(p_payload->>'notes'),0)>10000 then raise exception 'Fecha u observaciones inválidas.'; end if;
 if jsonb_typeof(p_payload->'items') is distinct from 'array' then raise exception 'Agregue artículos.'; end if;
 if jsonb_array_length(p_payload->'items') not between 1 and 300 then raise exception 'Agregue de 1 a 300 artículos.'; end if;
 v:=(p_payload->>'sales_tax_percent')::numeric;
 if v is null or v::text in ('NaN','Infinity','-Infinity') or v<0 or v>100 then raise exception 'Impuesto inválido.'; end if;
 for v_item in select value from jsonb_array_elements(p_payload->'items') loop
  if coalesce(length(btrim(v_item->>'description')),0) not between 2 and 4000 then raise exception 'Descripción requerida.'; end if;
  foreach v_key in array array['quantity','list_price','net_price','expenses_percent','import_tax_percent','margin_percent'] loop
   v:=(v_item->>v_key)::numeric;
   if v is null or v::text in ('NaN','Infinity','-Infinity') or v<0 or v>99999999.99 then raise exception 'Valor numérico inválido.'; end if;
   if v_key='quantity' and (v<=0 or v>999999.99) then raise exception 'Cantidad inválida.'; end if;
   if v_key in ('quantity','list_price','net_price') and v<>round(v,2) then raise exception 'Use dos decimales.'; end if;
   if v_key like '%percent' and (v>100 or v<>round(v,4)) then raise exception 'Porcentaje inválido.'; end if;
   if v_key='margin_percent' and v>=100 then raise exception 'Margen menor que 100%% requerido.'; end if;
  end loop;
 end loop;
 if p_id is null then
  insert into public.work_sheets(number,client_id,client_name,payload,request_id,created_by)
   values(bbs_private.next_module_number('HT'),(p_payload->>'client_id')::uuid,v_client,p_payload,p_request_id,auth.uid()) returning id into v_id;
 else
  update public.work_sheets set client_id=(p_payload->>'client_id')::uuid,client_name=v_client,payload=p_payload,updated_at=clock_timestamp() where id=p_id returning id into v_id;
 end if;
 return v_id;
end $$;

create function public.quote_from_work_sheet(p_id uuid,p_version timestamptz,p_request_id uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare w public.work_sheets; c jsonb; lines jsonb; d jsonb; q uuid; today date:=(now() at time zone 'America/Panama')::date;
begin
 if not bbs_private.can_quote() then raise exception 'No autorizado.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('worksheet:'||p_id::text,0));
 select * into w from public.work_sheets where id=p_id;
 if not found or w.updated_at is distinct from p_version then raise exception 'La hoja cambió. Recargue antes de crear la cotización.'; end if;
 select value into c from jsonb_array_elements(public.get_quote_clients()) where value->>'id'=w.client_id::text;
 if c is null then raise exception 'El cliente ya no está activo.'; end if;
 select jsonb_agg(jsonb_build_object('item_id',null,'sku',i->>'catalog','description',(i->>'description')||case when coalesce(i->>'provider','')<>'' then E'\nProveedor: '||(i->>'provider') else '' end,
  'quantity',(i->>'quantity')::numeric,'unit_price',round(((i->>'net_price')::numeric*(1+(i->>'expenses_percent')::numeric/100+(i->>'import_tax_percent')::numeric/100))/(1-(i->>'margin_percent')::numeric/100),2),
  'tax_rate',case when (c->>'tax_exempt')::boolean then 0 else (w.payload->>'sales_tax_percent')::numeric end,'discount_percent',0) order by pos) into lines from jsonb_array_elements(w.payload->'items') with ordinality a(i,pos);
 d:=jsonb_build_object('kind','quote','document_kind','quote','client_id',w.client_id,'client_name',c->>'name','client_email',c->>'email','seller_name',w.payload->>'seller_name',
  'billing_address',c->>'address','shipping_address',c->>'shipping_address','payment_terms',coalesce(c->>'payment_terms','days'),'payment_terms_days',coalesce((c->>'payment_terms_days')::integer,30),
  'payment_method_id',c->>'payment_method_id','payment_method_name',c->>'payment_method_name','tax_exempt',coalesce((c->>'tax_exempt')::boolean,false),
  'issue_date',today,'valid_until',today+30,'purchase_order',null,'project_description',w.payload->>'title','public_notes',null,'private_notes',null,'footer_notes',null,
  'discount_mode','none','discount_value',0,'shipping_amount',0,'shipping_tax_rate',0,'items',lines);
 q:=public.save_commercial_document(d,null,null,p_request_id,null,true);
 update public.quotes set source_worksheet_id=w.id,source_worksheet_number=w.number where id=q;
 return q;
end $$;

create function public.save_service_report(p_payload jsonb,p_request_id uuid,p_id uuid default null,p_version timestamptz default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_old public.service_reports; v_equipment jsonb; v_part jsonb;
begin
 if not bbs_private.is_admin() then raise exception 'No autorizado.' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'Falta solicitud.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request_id::text,0));
 if p_id is null then
  select * into v_old from public.service_reports where created_by=auth.uid() and request_id=p_request_id;
  if found then if v_old.payload<>p_payload then raise exception 'Solicitud ya utilizada.'; end if; return v_old.id; end if;
 else
  select * into v_old from public.service_reports where id=p_id for update;
  if not found or p_version is distinct from v_old.updated_at then raise exception 'El reporte cambió. Recargue antes de guardar.'; end if;
 end if;
 select to_jsonb(e)||jsonb_build_object('client_name',c.name) into v_equipment from public.equipment e join public.clients c on c.id=e.client_id where e.id=(p_payload->>'equipment_id')::uuid;
 if v_equipment is null then raise exception 'Equipo no encontrado.'; end if;
 if p_id is not null and v_old.equipment_id=(p_payload->>'equipment_id')::uuid then v_equipment:=v_old.equipment_snapshot; end if;
 if coalesce(p_payload->>'status','') not in ('programado','en_proceso','completado','cancelado') or coalesce(p_payload->>'condition','') not in ('funcional','fuera_de_servicio','observacion') then raise exception 'Estado inválido.'; end if;
 if coalesce(length(btrim(p_payload->>'description')),0) not between 2 and 5000 or coalesce(length(btrim(p_payload->>'technician')),0) not between 2 and 200 then raise exception 'Descripción y técnico requeridos.'; end if;
 if (p_payload->>'reported_date')::date is null or (p_payload->>'scheduled_date')::date is null then raise exception 'Fechas requeridas.'; end if;
 if p_payload->>'status'='completado' and nullif(p_payload->>'completed_date','') is null then raise exception 'Fecha de finalización requerida.'; end if;
 if nullif(p_payload->>'next_due_date','')::date<=nullif(p_payload->>'completed_date','')::date then raise exception 'Revise el próximo mantenimiento.'; end if;
 if jsonb_typeof(p_payload->'service_types') is distinct from 'array' or jsonb_typeof(p_payload->'parts') is distinct from 'array' then raise exception 'Tipos de servicio y piezas requeridos.'; end if;
 if jsonb_array_length(p_payload->'service_types') not between 1 and 4 or exists(select 1 from jsonb_array_elements_text(p_payload->'service_types') v where v not in ('preventivo','correctivo','instalacion','evaluacion')) then raise exception 'Tipo de servicio inválido.'; end if;
 if jsonb_array_length(p_payload->'parts')>100 or length(coalesce(p_payload->>'work_performed',''))>10000 or length(coalesce(p_payload->>'observations',''))>10000 then raise exception 'Reporte demasiado extenso.'; end if;
 for v_part in select value from jsonb_array_elements(p_payload->'parts') loop
  if coalesce(length(v_part->>'description'),0) not between 2 and 1000 or length(coalesce(v_part->>'catalog',''))>100 or jsonb_typeof(v_part->'quoted') is distinct from 'boolean' or jsonb_typeof(v_part->'installed') is distinct from 'boolean' then raise exception 'Pieza inválida.'; end if;
 end loop;
 if p_id is null then
  insert into public.service_reports(number,equipment_id,payload,equipment_snapshot,next_due_date,status,request_id,created_by) values(bbs_private.next_module_number('SR'),(p_payload->>'equipment_id')::uuid,p_payload,v_equipment,nullif(p_payload->>'next_due_date','')::date,p_payload->>'status',p_request_id,auth.uid()) returning id into v_id;
 else
  update public.service_reports set equipment_id=(p_payload->>'equipment_id')::uuid,payload=p_payload,equipment_snapshot=v_equipment,next_due_date=nullif(p_payload->>'next_due_date','')::date,status=p_payload->>'status',updated_at=clock_timestamp() where id=p_id returning id into v_id;
 end if;
 return v_id;
end $$;
revoke all on function public.save_work_sheet(jsonb,uuid,uuid,timestamptz),public.quote_from_work_sheet(uuid,timestamptz,uuid),public.save_service_report(jsonb,uuid,uuid,timestamptz) from public,anon;
grant execute on function public.save_work_sheet(jsonb,uuid,uuid,timestamptz),public.quote_from_work_sheet(uuid,timestamptz,uuid),public.save_service_report(jsonb,uuid,uuid,timestamptz) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('bbs-service-reports','bbs-service-reports',false,10485760,array['application/pdf','image/png','image/jpeg']),
 ('bbs-private-templates','bbs-private-templates',false,10485760,array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
 on conflict(id) do nothing;
create policy bbs_service_files_read on storage.objects for select to authenticated using(bucket_id='bbs-service-reports' and (select bbs_private.is_admin()));
create policy bbs_service_files_insert on storage.objects for insert to authenticated with check(bucket_id='bbs-service-reports' and (select bbs_private.is_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy bbs_template_files_read on storage.objects for select to authenticated using(bucket_id='bbs-private-templates' and (select bbs_private.can_templates()));
create policy bbs_template_files_insert on storage.objects for insert to authenticated with check(bucket_id='bbs-private-templates' and (select bbs_private.can_templates()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy bbs_service_files_cleanup on storage.objects for delete to authenticated using(bucket_id='bbs-service-reports' and (select bbs_private.is_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text and not exists(select 1 from public.service_attachments a where a.path=storage.objects.name));
create policy bbs_template_files_cleanup on storage.objects for delete to authenticated using(bucket_id='bbs-private-templates' and (select bbs_private.can_templates()) and (storage.foldername(name))[1]=(select auth.uid())::text and not exists(select 1 from public.document_templates t where t.path=storage.objects.name));

-- Internal reminders only: no email or WhatsApp is sent.
create function bbs_private.refresh_service_reminders() returns void language sql security definer set search_path='' as $$
 delete from public.service_reminders m where not exists(select 1 from public.service_reports r where r.id=m.report_id and r.status='completado' and r.next_due_date=m.due_date and r.next_due_date <= (now() at time zone 'America/Panama')::date+30 and not exists(select 1 from public.service_reports newer where newer.equipment_id=r.equipment_id and newer.id<>r.id and newer.status<>'cancelado' and (newer.payload->>'scheduled_date')::date>=r.next_due_date));
 insert into public.service_reminders(report_id,due_date)
 select id,next_due_date from public.service_reports r where status='completado' and next_due_date <= (now() at time zone 'America/Panama')::date+30
 and not exists(select 1 from public.service_reports newer where newer.equipment_id=r.equipment_id and newer.id<>r.id and newer.status<>'cancelado' and (newer.payload->>'scheduled_date')::date >= r.next_due_date)
 on conflict do nothing;
$$;
revoke all on function bbs_private.refresh_service_reminders() from public,anon,authenticated;
select cron.schedule('bbs-service-reminders','0 13 * * *','select bbs_private.refresh_service_reminders()');

-- Remove the obsolete role without granting extra administrative privileges.
update public.profiles set role='cotizador',updated_at=now() where role::text='aprobador';
alter table public.profiles add constraint profiles_three_roles check(role::text in ('super_admin','admin','cotizador'));
create or replace function bbs_private.can_quote() returns boolean language sql stable security definer set search_path='' as $$select coalesce(bbs_private.user_role() in ('super_admin','admin','cotizador'),false);$$;
create or replace function bbs_private.can_manage_clients() returns boolean language sql stable security definer set search_path='' as $$select bbs_private.is_admin();$$;

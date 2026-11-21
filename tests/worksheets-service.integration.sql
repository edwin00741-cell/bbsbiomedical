-- Synthetic fixtures and all assertions are rolled back, including counters.
begin;
do $setup$
declare actor text; uid uuid; cid uuid;
begin
 foreach actor in array array['admin','cotizador','forced'] loop
  uid:=gen_random_uuid();
  insert into auth.users(id,email,aud,role) values(uid,'qa-reunion-'||uid||'@example.invalid','authenticated','authenticated');
  insert into public.profiles(id,username,full_name,role,is_active,must_change_password)
   values(uid,'qa_reunion_'||replace(uid::text,'-',''),'QA Reunión',case when actor='admin' then 'admin'::public.bbs_role else 'cotizador'::public.bbs_role end,true,actor='forced');
  perform set_config('bbs.qa.'||actor,uid::text,true);
 end loop;
 insert into public.clients(name,is_active,address,payment_terms,payment_terms_days) values('QA Reunión cliente',true,'Dirección de prueba','days',30) returning id into cid;
 perform set_config('bbs.qa.client',cid::text,true);
end $setup$;
set local role authenticated;
do $checks$
declare payload jsonb; sid uuid; rid uuid; qid uuid; eid uuid; req uuid:=gen_random_uuid(); stamp timestamptz; denied boolean; counter integer;
begin
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.admin'),true);
 payload:=jsonb_build_object('client_id',current_setting('bbs.qa.client'),'title','Proyecto de prueba','seller_name','Vendedor QA','issue_date','2026-11-21','notes','PRIVATE_WORKSHEET_COSTS','sales_tax_percent',7,'items',jsonb_build_array(jsonb_build_object('description','Equipo de prueba','catalog','CAT-QA','provider','Proveedor QA','quantity',2,'list_price',200,'net_price',100,'expenses_percent',10,'shipping','Aéreo','import_tax_percent',7,'margin_percent',20)));
 sid:=public.save_work_sheet(payload,req);
 if sid is distinct from public.save_work_sheet(payload,req) then raise exception 'Worksheet retry created duplicate'; end if;
 select updated_at into stamp from public.work_sheets where id=sid;
 denied:=false;begin perform public.save_work_sheet(payload,gen_random_uuid(),sid,stamp-interval '1 second');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'Stale worksheet overwrite accepted'; end if;
 perform set_config('bbs.qa.sheet',sid::text,true);
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.cotizador'),true);
 if not exists(select 1 from public.work_sheets where id=sid) then raise exception 'Cotizador cannot read worksheet'; end if;
 denied:=false;begin perform public.save_work_sheet(payload,gen_random_uuid());exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Cotizador wrote worksheet'; end if;
 req:=gen_random_uuid();qid:=public.quote_from_work_sheet(sid,stamp,req);
 if qid is distinct from public.quote_from_work_sheet(sid,stamp,req) then raise exception 'Quote retry created duplicate'; end if;
 if not exists(select 1 from public.quotes where id=qid and total=312.98 and source_worksheet_id=sid and source_worksheet_number like 'HT-%') then raise exception 'Quote totals or source link incorrect'; end if;
 if not exists(select 1 from public.quote_items where quote_id=qid and unit_price=146.25 and quantity=2 and sku_snapshot='CAT-QA' and description like '%Proveedor QA%') then raise exception 'Quote lines not copied correctly'; end if;
 if exists(select 1 from public.quotes q where q.id=qid and to_jsonb(q)::text like '%PRIVATE_WORKSHEET_COSTS%') then raise exception 'Internal worksheet notes leaked into quote'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.forced'),true);
 if exists(select 1 from public.work_sheets) then raise exception 'Forced password change can access worksheets'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.admin'),true);
 insert into public.equipment(client_id,description,serial_number,brand,model) values(current_setting('bbs.qa.client')::uuid,'Equipo original QA','SERIE-QA','Marca QA','Modelo QA') returning id into eid;
 payload:=jsonb_build_object('equipment_id',eid,'reported_date',current_date,'scheduled_date',current_date,'completed_date',current_date,'next_due_date',current_date+10,'purchase_order','OC-QA','service_types',jsonb_build_array('preventivo'),'status','completado','condition','funcional','description','Revisión de prueba','work_performed','Limpieza','observations','Observaciones QA','received_by','Cliente QA','technician','Técnico QA','parts','[]'::jsonb);
 req:=gen_random_uuid();rid:=public.save_service_report(payload,req);
 if rid is distinct from public.save_service_report(payload,req) then raise exception 'Service retry created duplicate'; end if;
 select updated_at into stamp from public.service_reports where id=rid;
 update public.equipment set description='Equipo cambiado QA' where id=eid;
 perform public.save_service_report(payload||'{"observations":"Actualizado"}',gen_random_uuid(),rid,stamp);
 if not exists(select 1 from public.service_reports where id=rid and equipment_snapshot->>'description'='Equipo original QA') then raise exception 'Report equipment snapshot changed'; end if;
 perform set_config('bbs.qa.report',rid::text,true);perform set_config('bbs.qa.equipment',eid::text,true);
 denied:=false;begin insert into public.document_templates(name,path) values('Forbidden QA','forbidden-qa.pdf');exception when insufficient_privilege then denied:=true;end;
 if not denied or bbs_private.can_templates() then raise exception 'Another admin accessed Bryan templates'; end if;
 denied:=false;begin insert into storage.objects(bucket_id,name) values('bbs-private-templates',auth.uid()::text||'/forbidden-qa.pdf');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Another admin uploaded to Bryan bucket'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.cotizador'),true);
 if exists(select 1 from public.equipment where id=eid) or exists(select 1 from public.service_reports where id=rid) then raise exception 'Cotizador accessed service module'; end if;
 denied:=false;begin insert into storage.objects(bucket_id,name) values('bbs-service-reports',auth.uid()::text||'/forbidden-qa.pdf');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Cotizador uploaded service document'; end if;
end $checks$;
reset role;
select bbs_private.refresh_service_reminders();
do $reminders$
begin
 if not exists(select 1 from public.service_reminders where report_id=current_setting('bbs.qa.report')::uuid) then raise exception 'Due reminder missing'; end if;
 update public.service_reports set status='cancelado' where id=current_setting('bbs.qa.report')::uuid;
 perform bbs_private.refresh_service_reminders();
 if exists(select 1 from public.service_reminders where report_id=current_setting('bbs.qa.report')::uuid) then raise exception 'Obsolete reminder retained'; end if;
 perform set_config('request.jwt.claim.sub',(select id::text from public.profiles where username='bryanrodriguez'),true);
end $reminders$;
set local role authenticated;
do $bryan$
begin
 if not bbs_private.can_templates() then raise exception 'Bryan lost templates access'; end if;
 insert into public.document_templates(name,path) values('QA private template',auth.uid()::text||'/qa-only.pdf');
 if not exists(select 1 from public.document_templates where name='QA private template') then raise exception 'Bryan cannot read own template'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('bbs.qa.admin'),true);
 if exists(select 1 from public.document_templates) then raise exception 'Bryan template visible to other administrator'; end if;
end $bryan$;
rollback;
select 'PASS: worksheet/quote math, retries, stale versions, service snapshots, reminders, and private RLS; fixtures rolled back.' as result;

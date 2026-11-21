-- Full transaction rollback: no test invoices, templates or stock movements persist.
begin;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'role','authenticated')::text from public.profiles where is_active and role::text='super_admin' order by id limit 1),true);
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where is_active and role::text='super_admin' order by id limit 1),true);
set local role authenticated;
do $test$
declare source_id uuid; template_id uuid; generated_id uuid; future_id uuid; draft_id uuid; client_id uuid; request_id uuid:=gen_random_uuid();
  today date:=(now() at time zone 'America/Panama')::date; version timestamptz; outcome jsonb; rejected boolean:=false;
  document jsonb:='{"kind":"invoice","document_kind":"quote","client_id":null,"client_name":"QA recurrence rollback","client_email":null,"seller_name":"QA vendedor","billing_address":"QA billing","shipping_address":"QA shipping","payment_terms":"days","payment_terms_days":15,"payment_method_id":null,"payment_method_name":null,"tax_exempt":false,"issue_date":"2026-10-26","valid_until":"2026-10-26","purchase_order":null,"project_description":null,"public_notes":"QA public","private_notes":"QA private","footer_notes":"QA footer","discount_mode":"none","discount_value":0,"shipping_amount":0,"shipping_tax_rate":0,"items":[{"item_id":null,"description":"QA recurring service","quantity":1,"unit_price":100,"tax_rate":7,"discount_percent":0}]}'::jsonb;
begin
  insert into public.clients(name,created_by) values('QA recurrence rollback',auth.uid()) returning id into client_id;
  document:=document||jsonb_build_object('client_id',client_id);
  source_id:=public.save_commercial_document(document,null,null,gen_random_uuid(),null,false);
  update public.invoices set business_snapshot=jsonb_build_object('business_name','QA recurrence snapshot','currency','USD') where id=source_id;
  template_id:=public.create_invoice_recurrence(source_id,'QA recurrence',today,today,'months',1,request_id);
  if public.create_invoice_recurrence(source_id,'QA recurrence',today,today,'months',1,request_id)<>template_id then raise exception 'FAIL repeated create'; end if;
  begin perform public.create_invoice_recurrence(source_id,'Changed name',today,today,'months',1,request_id); exception when others then rejected:=sqlerrm like 'Solicitud reutilizada%'; end;
  if not rejected then raise exception 'FAIL changed request was accepted'; end if;
  select updated_at into version from public.recurring_invoices where id=template_id;
  perform public.update_invoice_recurrence(template_id,version,'QA recurrence',today,'paused');
  outcome:=public.run_due_invoice_recurrences(); if (outcome->>'generated')::integer<>0 then raise exception 'FAIL paused template emitted'; end if;
  select updated_at into version from public.recurring_invoices where id=template_id;
  perform public.update_invoice_recurrence(template_id,version,'QA recurrence',today,'active');
  outcome:=public.run_due_invoice_recurrences(); if (outcome->>'generated')::integer<>1 then raise exception 'FAIL due generation %',outcome; end if;
  outcome:=public.run_due_invoice_recurrences(); if (outcome->>'generated')::integer<>0 then raise exception 'FAIL duplicate emission'; end if;
  select invoice_id into generated_id from public.recurring_invoice_runs where recurrence_id=template_id;
  if not exists(select 1 from public.invoices where id=generated_id and total=107 and due_date=today+15 and status='sent' and business_snapshot->>'business_name'='QA recurrence snapshot') then raise exception 'FAIL financial snapshot or due date'; end if;
  if not exists(select 1 from public.recurring_invoices where id=template_id and run_count=1 and status='completed') then raise exception 'FAIL end date'; end if;
  future_id:=public.create_invoice_recurrence(source_id,'QA future',today+1,null,'weeks',1,gen_random_uuid());
  outcome:=public.run_due_invoice_recurrences(); if exists(select 1 from public.recurring_invoice_runs where recurrence_id=future_id) then raise exception 'FAIL premature emission'; end if;
  select updated_at into version from public.invoices where id=generated_id;
  perform public.invoice_lifecycle_action(generated_id,version,'mark_emailed');
  if not exists(select 1 from public.invoices where id=generated_id and emailed_at is not null) then raise exception 'FAIL manual mail flag'; end if;
  select updated_at into version from public.invoices where id=generated_id;
  perform public.invoice_lifecycle_action(generated_id,version,'void');
  if not exists(select 1 from public.invoices where id=generated_id and status='void') then raise exception 'FAIL void'; end if;
  draft_id:=public.save_commercial_document(document,null,null,gen_random_uuid(),null,true);
  select updated_at into version from public.invoices where id=draft_id;
  perform public.invoice_lifecycle_action(draft_id,version,'delete_draft');
  if exists(select 1 from public.invoices where id=draft_id) then raise exception 'FAIL draft delete'; end if;
end;
$test$;
set local role anon;
do $denied$
declare rejected boolean:=false;
begin
  begin perform public.run_due_invoice_recurrences(); exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL anonymous runner'; end if;
end;
$denied$;
rollback;
select 'PASS authenticated recurrence snapshots/idempotency/pause/future/completion/lifecycle and anonymous denial; rollback' as result;

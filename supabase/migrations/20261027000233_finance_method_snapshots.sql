alter table public.payments add column payment_method_name text;
alter table public.refunds add column payment_method_name text;
update public.payments p set payment_method_name=m.name from public.payment_methods m where p.payment_method_id=m.id;
update public.refunds r set payment_method_name=m.name from public.payment_methods m where r.payment_method_id=m.id;

do $migration$
declare definition text; i integer;
 before_patterns text[]:=array[
  $$client_id,client_name,payment_method_id,payment_number$$,
  $$client,c.name,nullif(p_command->>'payment_method_id','')::uuid,bbs_private$$,
  $$set paid_at=(p_command->>'date')::date,payment_method_id=nullif(p_command->>'payment_method_id','')::uuid,reference=$$,
  $$credit_application_id,payment_method_id,reference,finance_version$$,
  $$source,app_id,nullif(p_command->>'payment_method_id','')::uuid,nullif(p_command->>'reference',''),1$$
 ];
 after_patterns text[]:=array[
  $$client_id,client_name,payment_method_id,payment_method_name,payment_number$$,
  $$client,c.name,nullif(p_command->>'payment_method_id','')::uuid,(select m.name from public.payment_methods m where m.id=nullif(p_command->>'payment_method_id','')::uuid),bbs_private$$,
  $$set paid_at=(p_command->>'date')::date,payment_method_id=nullif(p_command->>'payment_method_id','')::uuid,payment_method_name=(select m.name from public.payment_methods m where m.id=nullif(p_command->>'payment_method_id','')::uuid),reference=$$,
  $$credit_application_id,payment_method_id,payment_method_name,reference,finance_version$$,
  $$source,app_id,nullif(p_command->>'payment_method_id','')::uuid,(select m.name from public.payment_methods m where m.id=nullif(p_command->>'payment_method_id','')::uuid),nullif(p_command->>'reference',''),1$$
 ];
begin
 select pg_get_functiondef('public.bbs_finance_command(jsonb,uuid)'::regprocedure) into definition;
 for i in 1..array_length(before_patterns,1) loop
  if strpos(definition,before_patterns[i])=0 then raise exception 'Financial method snapshot pattern % not found.',i; end if;
  definition:=replace(definition,before_patterns[i],after_patterns[i]);
 end loop;
 execute definition;
end $migration$;

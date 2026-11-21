begin;
-- Ephemeral Auth/Profile fixtures are inserted administratively and rolled back.
do $fixtures$
declare r text; uid uuid; client uuid; inactive uuid; item uuid; quote uuid; doc jsonb; bad boolean:=false;
begin
 foreach r in array array['admin','cotizador','cotizador2','forced','inactive'] loop
  uid:=gen_random_uuid();
  insert into auth.users(id,email,aud,role) values(uid,'qa-rbac-'||uid::text||'@example.test','authenticated','authenticated');
  insert into public.profiles(id,username,full_name,role,is_active,must_change_password)
   values(uid,'qa_rbac_'||replace(uid::text,'-',''),'QA RBAC '||r,case when r in ('cotizador2','forced','inactive') then 'cotizador'::public.bbs_role else r::public.bbs_role end,r<>'inactive',r='forced');
  perform set_config('bbs.rbac.'||r,uid::text,true);
 end loop;
 uid:=gen_random_uuid(); insert into auth.users(id,email,aud,role) values(uid,'qa-rbac-'||uid::text||'@example.test','authenticated','authenticated');
 begin insert into public.profiles(id,username,full_name,role) values(uid,'qa_forbidden_sa_'||replace(uid::text,'-',''),'Forbidden SA','super_admin'); exception when check_violation then bad:=true; end;
 if not bad then raise exception 'An unreserved account became super administrator.'; end if;
 insert into public.clients(name,is_active,notes,address,payment_terms,payment_terms_days) values('QA RBAC Approved',true,'SECRET_CLIENT_PRIVATE','Public billing','days',45) returning id into client;
 insert into public.clients(name,is_active) values('QA RBAC Unapproved',false) returning id into inactive;
 insert into public.items(name,sku,unit_price,is_active,private_notes,supplier,stock_quantity) values('QA RBAC Catalog','QA-'||gen_random_uuid()::text,100,true,'SECRET_CATALOG_PRIVATE','SECRET_SUPPLIER',99) returning id into item;
 perform set_config('bbs.rbac.client',client::text,true); perform set_config('bbs.rbac.inactive_client',inactive::text,true); perform set_config('bbs.rbac.item',item::text,true);
 doc:=jsonb_build_object('kind','quote','document_kind','quote','client_id',client,'client_name','QA RBAC Approved','client_email',null,'seller_name','QA Seller','billing_address','Public billing','shipping_address',null,'payment_terms','days','payment_terms_days',45,'payment_method_id',null,'payment_method_name',null,'tax_exempt',false,'issue_date','2026-10-26','valid_until','2026-11-26','purchase_order',null,'project_description',null,'public_notes','Public quote','private_notes','Private quote','footer_notes',null,'discount_mode','none','discount_value',0,'shipping_amount',0,'shipping_tax_rate',0,'items',jsonb_build_array(jsonb_build_object('item_id',item,'description','QA RBAC Service','quantity',1,'unit_price',100,'tax_rate',7,'discount_percent',0)));
 perform set_config('bbs.rbac.document',doc::text,true);
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.cotizador2'),true);
 quote:=public.save_commercial_document(doc,null,null,gen_random_uuid(),null,false); perform set_config('bbs.rbac.other_quote',quote::text,true);
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.admin'),true);
 quote:=public.save_commercial_document(doc||'{"kind":"invoice"}'::jsonb,null,null,gen_random_uuid(),null,false);
 perform set_config('bbs.rbac.invoice',quote::text,true);
 perform public.bbs_finance_command(jsonb_build_object('operation','payment.create','client_id',client,'amount',10,'date','2026-10-26','payment_method_id',null,'reference','QA RBAC','notes',null,'allocations','[]'::jsonb),gen_random_uuid());
end $fixtures$;
set local role authenticated;
do $test$
declare doc jsonb:=current_setting('bbs.rbac.document')::jsonb; client uuid:=current_setting('bbs.rbac.client')::uuid; own_quote uuid; legacy uuid; stamp timestamptz; failed boolean; affected integer; data jsonb;
begin
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.cotizador'),true);
 if bbs_private.is_admin() or not bbs_private.can_quote() then raise exception 'Quote maker role classification failed'; end if;
 if exists(select 1 from public.clients) or exists(select 1 from public.items) or exists(select 1 from public.bbs_client_directory) then raise exception 'Quote maker read direct private client/catalog rows'; end if;
 data:=public.get_quote_clients();
 if not exists(select 1 from jsonb_array_elements(data) c where c->>'id'=client::text and (c->>'payment_terms_days')::integer=45 and c->>'notes' is null and (c->>'balance')::numeric=0) then raise exception 'Safe client commercial conditions missing'; end if;
 if exists(select 1 from jsonb_array_elements(data) c where c->>'id'=current_setting('bbs.rbac.inactive_client')) or data::text like '%SECRET_CLIENT_PRIVATE%' then raise exception 'Unapproved/private client leaked'; end if;
 data:=public.get_quote_catalog();
 if data::text like '%SECRET_CATALOG_PRIVATE%' or data::text like '%SECRET_SUPPLIER%' or data::text like '%stock_quantity%' then raise exception 'Safe catalog leaked private fields'; end if;
 own_quote:=public.save_commercial_document(doc,null,null,gen_random_uuid(),null,false);
 perform set_config('bbs.rbac.own_quote',own_quote::text,true);
 if not exists(select 1 from public.quotes where id=own_quote and created_by=auth.uid() and total=107) then raise exception 'Quote maker atomic create failed'; end if;
 if exists(select 1 from public.quotes where id=current_setting('bbs.rbac.other_quote')::uuid) or exists(select 1 from public.quote_items where quote_id=current_setting('bbs.rbac.other_quote')::uuid) then raise exception 'Quote maker read another owner'; end if;
 select updated_at into stamp from public.quotes where id=own_quote;
 perform public.save_commercial_document(doc||'{"public_notes":"Owner draft update"}',own_quote,stamp,gen_random_uuid(),null,false);
 legacy:=public.save_quote(doc,doc->'items',null);
 if not exists(select 1 from public.quotes where id=legacy and created_by=auth.uid()) then raise exception 'Legacy quote role guard did not permit own create'; end if;
 delete from public.quotes where id=legacy;
 if exists(select 1 from public.quotes where id=legacy) or exists(select 1 from public.quote_items where quote_id=legacy) then raise exception 'Owned draft cascade deletion failed'; end if;
 failed:=false; begin update public.quotes set status='approved' where id=own_quote; exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Raw self approval accepted'; end if;
 failed:=false; begin update public.quotes set created_by=current_setting('bbs.rbac.cotizador2')::uuid where id=own_quote; exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Owner transfer accepted'; end if;
 failed:=false; begin update public.profiles set role='super_admin' where id=auth.uid(); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Self privilege escalation accepted'; end if;
 if exists(select 1 from public.profiles where id<>auth.uid()) then raise exception 'Quote maker listed user accounts'; end if;
 failed:=false; begin insert into public.clients(name) values('QA Unauthorized Client'); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Quote maker created client'; end if;
 failed:=false; begin perform public.save_commercial_document(doc||'{"kind":"invoice"}',null,null,gen_random_uuid(),null,false); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Quote maker created invoice'; end if;
 failed:=false; begin perform public.bbs_finance_command(jsonb_build_object('operation','payment.create','client_id',client,'amount',1,'date','2026-10-26','payment_method_id',null,'reference',null,'notes',null,'allocations','[]'::jsonb),gen_random_uuid()); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Quote maker accessed cash operation'; end if;
 if exists(select 1 from public.invoices) or exists(select 1 from public.payments) or exists(select 1 from public.credit_notes) or exists(select 1 from public.finance_events) then raise exception 'Quote maker read financial rows'; end if;
 failed:=false; begin perform public.save_commercial_document(doc||jsonb_build_object('client_id',current_setting('bbs.rbac.inactive_client')::uuid),null,null,gen_random_uuid(),null,false); exception when raise_exception or insufficient_privilege then failed:=true; end; if not failed then raise exception 'Quote maker used inactive client'; end if;
 -- Administrators now own approval and client management.
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.admin'),true);
 if not bbs_private.can_manage_clients() then raise exception 'Admin client management denied'; end if;
 update public.quotes set status='approved' where id=own_quote;
 if not exists(select 1 from public.quotes where id=own_quote and status='approved') then raise exception 'Administrator approval failed'; end if;
 -- Approved quotes remain visible to their owner and no longer accept edits.
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.cotizador'),true);
 if not exists(select 1 from public.quotes where id=own_quote and status='approved') then raise exception 'Owner lost approved quote visibility'; end if;
 update public.quotes set notes='Unauthorized approved edit' where id=own_quote; get diagnostics affected=row_count; if affected<>0 then raise exception 'Owner edited approved header'; end if;
 update public.quote_items set unit_price=1 where quote_id=own_quote; get diagnostics affected=row_count; if affected<>0 then raise exception 'Owner edited approved lines'; end if;
 failed:=false; begin insert into public.quote_items(quote_id,description,quantity,unit_price,position) values(own_quote,'Unauthorized approved line',1,1,99); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Owner inserted approved line'; end if;
 select updated_at into stamp from public.quotes where id=own_quote;
 failed:=false; begin perform public.save_commercial_document(doc,own_quote,stamp,gen_random_uuid(),null,false); exception when insufficient_privilege or raise_exception then failed:=true; end; if not failed then raise exception 'Owner atomic edited approved quote'; end if;
 -- Required password changes and inactive accounts cannot bypass the UI using RPC.
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.forced'),true);
 if bbs_private.can_quote() then raise exception 'Forced password change did not suspend business access'; end if;
 failed:=false; begin perform public.get_quote_catalog(); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Forced account accessed selector'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.inactive'),true);
 if bbs_private.can_quote() or bbs_private.is_admin() then raise exception 'Inactive account received permissions'; end if;
 -- Administrative finance access remains available, profile writes stay server-only.
 perform set_config('request.jwt.claim.sub',current_setting('bbs.rbac.admin'),true);
 if not bbs_private.is_admin() or not exists(select 1 from public.invoices where id=current_setting('bbs.rbac.invoice')::uuid) or not exists(select 1 from public.payments where client_id=client) then raise exception 'Administrator lost financial access'; end if;
 if not exists(select 1 from public.profiles where role='super_admin') then raise exception 'Administrator cannot list users'; end if;
 failed:=false; begin update public.profiles set role='super_admin' where id=auth.uid(); exception when insufficient_privilege then failed:=true; end; if not failed then raise exception 'Direct administrator profile elevation accepted'; end if;
end $test$;
rollback;

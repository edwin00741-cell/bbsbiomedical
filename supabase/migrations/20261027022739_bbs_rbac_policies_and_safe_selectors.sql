-- Role checks do not trust editable auth metadata. Password changes are enforced
-- for both application requests and direct Data API/RPC access.
create or replace function bbs_private.user_role() returns text language sql stable security definer set search_path='' as $$
 select role::text from public.profiles where id=auth.uid() and is_active and not must_change_password;
$$;
create or replace function bbs_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(bbs_private.user_role() in ('super_admin','admin'),false);
$$;
create or replace function bbs_private.can_quote() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(bbs_private.user_role() in ('super_admin','admin','aprobador','cotizador'),false);
$$;
create or replace function bbs_private.can_manage_clients() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(bbs_private.user_role() in ('super_admin','admin','aprobador'),false);
$$;
create or replace function bbs_private.can_save_commercial(p_kind text) returns boolean language sql stable security definer set search_path='' as $$
 select case when p_kind='quote' then bbs_private.can_quote() when p_kind='invoice' then bbs_private.is_admin() else false end;
$$;
create or replace function bbs_private.quote_client_exists(p_id uuid,p_active boolean) returns boolean language sql stable security definer set search_path='' as $$
 select bbs_private.can_quote() and exists(select 1 from public.clients where id=p_id and (not p_active or is_active));
$$;
create or replace function bbs_private.quote_item_sku(p_id uuid) returns text language sql stable security definer set search_path='' as $$
 select sku from public.items where id=p_id and is_active and bbs_private.can_quote();
$$;
create or replace function bbs_private.can_read_quote(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select bbs_private.can_manage_clients() or (bbs_private.user_role()='cotizador' and exists(select 1 from public.quotes where id=p_id and created_by=auth.uid()));
$$;
create or replace function bbs_private.can_write_quote(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select bbs_private.can_manage_clients() or (bbs_private.user_role()='cotizador' and exists(select 1 from public.quotes where id=p_id and created_by=auth.uid() and status in ('draft','sent')));
$$;
revoke all on function bbs_private.user_role(),bbs_private.is_admin(),bbs_private.can_quote(),bbs_private.can_manage_clients(),bbs_private.can_save_commercial(text),bbs_private.quote_client_exists(uuid,boolean),bbs_private.quote_item_sku(uuid),bbs_private.can_read_quote(uuid),bbs_private.can_write_quote(uuid) from public,anon;
grant execute on function bbs_private.user_role(),bbs_private.is_admin(),bbs_private.can_quote(),bbs_private.can_manage_clients(),bbs_private.can_save_commercial(text),bbs_private.quote_client_exists(uuid,boolean),bbs_private.quote_item_sku(uuid),bbs_private.can_read_quote(uuid),bbs_private.can_write_quote(uuid) to authenticated;

-- Ordinary sessions cannot alter identity, activation or role columns.
drop policy if exists profiles_update_self on public.profiles;
revoke insert,update,delete on public.profiles from authenticated;
alter table public.profiles add constraint profiles_reserved_super_admin check(role::text<>'super_admin' or username in ('bryanrodriguez','edwin00741','edwin00741_gmail'));

create policy clients_approver_all on public.clients for all to authenticated using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()));
create policy client_groups_approver_all on public.client_groups for all to authenticated using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()));
create policy salespeople_approver_all on public.salespeople for all to authenticated using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()));
create policy payment_methods_approver_all on public.payment_methods for all to authenticated using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()));
create policy business_settings_quote_read on public.business_settings for select to authenticated using((select bbs_private.can_quote()));
create policy tax_rates_quote_read on public.tax_rates for select to authenticated using(is_active and (select bbs_private.can_quote()));
create policy salespeople_quote_read on public.salespeople for select to authenticated using((select bbs_private.can_quote()));
create policy payment_methods_quote_read on public.payment_methods for select to authenticated using((select bbs_private.can_quote()));

create policy quotes_approver_all on public.quotes for all to authenticated using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()));
create policy quotes_cotizador_read on public.quotes for select to authenticated using(created_by=auth.uid() and (select bbs_private.user_role())='cotizador');
create policy quotes_cotizador_insert on public.quotes for insert to authenticated with check(created_by=auth.uid() and status in ('draft','sent') and (select bbs_private.user_role())='cotizador' and bbs_private.quote_client_exists(client_id,true));
create policy quotes_cotizador_update on public.quotes for update to authenticated using(created_by=auth.uid() and status in ('draft','sent') and (select bbs_private.user_role())='cotizador') with check(created_by=auth.uid() and status in ('draft','sent') and (select bbs_private.user_role())='cotizador' and bbs_private.quote_client_exists(client_id,true));
create policy quotes_cotizador_delete on public.quotes for delete to authenticated using(created_by=auth.uid() and status in ('draft','sent') and (select bbs_private.user_role())='cotizador');
create policy quote_items_role_read on public.quote_items for select to authenticated using(bbs_private.can_read_quote(quote_id));
create policy quote_items_role_insert on public.quote_items for insert to authenticated with check(bbs_private.can_write_quote(quote_id));
create policy quote_items_role_update on public.quote_items for update to authenticated using(bbs_private.can_write_quote(quote_id)) with check(bbs_private.can_write_quote(quote_id));
create policy quote_items_role_delete on public.quote_items for delete to authenticated using(bbs_private.can_write_quote(quote_id));
create policy quote_events_role_read on public.quote_events for select to authenticated using(bbs_private.can_read_quote(quote_id));
create policy quote_events_role_insert on public.quote_events for insert to authenticated with check(actor_id=auth.uid() and bbs_private.can_write_quote(quote_id) and ((select bbs_private.can_manage_clients()) or event_type not in ('approved','rejected')));

-- Triggers protect state transitions and line changes even through raw REST calls.
create or replace function bbs_private.protect_quote_role() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if bbs_private.user_role()='cotizador' then
  if tg_op<>'INSERT' and (old.created_by is distinct from auth.uid() or old.status not in ('draft','sent')) then raise exception 'Solo puede modificar sus cotizaciones en borrador o enviadas.' using errcode='42501'; end if;
  if tg_op<>'DELETE' and (new.created_by is distinct from auth.uid() or new.status not in ('draft','sent') or not bbs_private.quote_client_exists(new.client_id,true)) then raise exception 'Seleccione un cliente activo; la aprobación requiere un aprobador.' using errcode='42501'; end if;
  if tg_op='UPDATE' and new.created_by is distinct from old.created_by then raise exception 'No puede cambiar el creador de la cotización.' using errcode='42501'; end if;
 end if;
 if tg_op='DELETE' then perform set_config('bbs.deleting_quote',old.id::text,true); return old; end if;
 return new;
end $$;
create trigger quotes_protect_role before insert or update or delete on public.quotes for each row execute function bbs_private.protect_quote_role();
create or replace function bbs_private.protect_quote_line_role() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if bbs_private.user_role()='cotizador' then
  if tg_op='DELETE' and current_setting('bbs.deleting_quote',true)=old.quote_id::text then return old; end if;
  if tg_op<>'INSERT' and not bbs_private.can_write_quote(old.quote_id) then raise exception 'La cotización ya no admite cambios de sus artículos.' using errcode='42501'; end if;
  if tg_op<>'DELETE' and not bbs_private.can_write_quote(new.quote_id) then raise exception 'No puede modificar artículos de esta cotización.' using errcode='42501'; end if;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger quote_items_protect_role before insert or update or delete on public.quote_items for each row execute function bbs_private.protect_quote_line_role();
revoke all on function bbs_private.protect_quote_role(),bbs_private.protect_quote_line_role() from public,anon,authenticated;

create or replace function bbs_private.get_quote_clients() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not bbs_private.can_quote() then raise exception 'No autorizado.' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',c.id,'name',c.name,'email',c.email,'phone',c.phone,'contact_name',c.contact_name,'address',c.address,'shipping_address',c.shipping_address,
  'notes',null,'statement_footer',c.statement_footer,'public_notes',c.public_notes,'group_id',c.group_id,'group_name',coalesce(g.name,'Predeterminado'),
  'salesperson_id',c.salesperson_id,'salesperson_name',s.name,'payment_method_id',c.payment_method_id,'payment_method_name',m.name,
  'is_active',c.is_active,'tax_exempt',c.tax_exempt,'payment_terms',c.payment_terms,'payment_terms_days',c.payment_terms_days,
  'balance',0,'next_due_date',null,'last_invoice_number',null,'last_invoice_id',null,'updated_at',c.updated_at) order by c.name,c.id),'[]'::jsonb)
 into result from public.clients c left join public.client_groups g on g.id=c.group_id left join public.salespeople s on s.id=c.salesperson_id left join public.payment_methods m on m.id=c.payment_method_id where c.is_active;
 return result;
end $$;
create or replace function bbs_private.get_quote_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not bbs_private.can_quote() then raise exception 'No autorizado.' using errcode='42501'; end if;
 return jsonb_build_object(
  'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'sku',i.sku,'name',i.name,'description',i.description,'unit_price',i.unit_price,'tax_rate',round(coalesce(t.rate,(select rate from public.tax_rates where is_default and is_active order by id limit 1),0)*100,4)) order by i.name,i.id),'[]'::jsonb) from public.items i left join public.tax_rates t on t.id=i.tax_rate_id and t.is_active where i.is_active),
  'taxes',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'rate',round(rate*100,4),'is_default',is_default) order by rate,id),'[]'::jsonb) from public.tax_rates where is_active),
  'methods',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name,id),'[]'::jsonb) from public.payment_methods),
  'sellers',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name,id),'[]'::jsonb) from public.salespeople)
 );
end $$;
create function public.get_quote_clients() returns jsonb language sql security invoker set search_path='' as $$select bbs_private.get_quote_clients();$$;
create function public.get_quote_catalog() returns jsonb language sql security invoker set search_path='' as $$select bbs_private.get_quote_catalog();$$;
revoke all on function bbs_private.get_quote_clients(),bbs_private.get_quote_catalog(),public.get_quote_clients(),public.get_quote_catalog() from public,anon;
grant execute on function bbs_private.get_quote_clients(),bbs_private.get_quote_catalog(),public.get_quote_clients(),public.get_quote_catalog() to authenticated;

-- Existing atomic saves keep their calculations, numbering and conflict guards.
do $migration$
declare definition text;
 before_guard text:=$$if auth.uid() is null or not bbs_private.is_admin() then$$;
begin
 select pg_get_functiondef('public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean)'::regprocedure) into definition;
 if strpos(definition,before_guard)=0 then raise exception 'Expected commercial authorization guard was not found.'; end if;
 definition:=replace(definition,before_guard,$$if auth.uid() is null or not bbs_private.can_save_commercial(v_kind) then$$);
 definition:=replace(definition,'not exists(select 1 from public.clients where id=v_client_id and is_active)','not bbs_private.quote_client_exists(v_client_id,true)');
 definition:=replace(definition,'not exists(select 1 from public.clients where id=v_client_id)','not bbs_private.quote_client_exists(v_client_id,false)');
 definition:=replace(definition,'select sku into v_sku from public.items where id=(v_item->>''item_id'')::uuid','select bbs_private.quote_item_sku((v_item->>''item_id'')::uuid) into v_sku');
 execute definition;
 select pg_get_functiondef('public.save_quote(jsonb,jsonb,uuid)'::regprocedure) into definition;
 if strpos(definition,before_guard)=0 then raise exception 'Expected legacy quote authorization guard was not found.'; end if;
 execute replace(definition,before_guard,$$if auth.uid() is null or not bbs_private.can_quote() then$$);
end $migration$;

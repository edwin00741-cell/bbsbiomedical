-- One permissive policy per command avoids evaluating overlapping role checks.
drop policy clients_admin_all on public.clients;
drop policy client_groups_admin_all on public.client_groups;
drop policy quote_items_admin_all on public.quote_items;
drop policy quote_events_admin_all on public.quote_events;
create policy quote_events_admin_update on public.quote_events for update to authenticated using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()));
create policy quote_events_admin_delete on public.quote_events for delete to authenticated using((select bbs_private.is_admin()));
alter policy quote_events_role_insert on public.quote_events with check(actor_id=(select auth.uid()) and bbs_private.can_write_quote(quote_id) and ((select bbs_private.can_manage_clients()) or event_type not in ('approved','rejected')));

drop policy business_settings_admin_all on public.business_settings;
drop policy tax_rates_admin_all on public.tax_rates;
alter policy tax_rates_quote_read on public.tax_rates using((select bbs_private.is_admin()) or (is_active and (select bbs_private.can_quote())));
do $policies$
declare table_name text; command text;
begin
 foreach table_name in array array['business_settings','tax_rates'] loop
  foreach command in array array['insert','update','delete'] loop
   execute format('create policy %I on public.%I for %s to authenticated %s',table_name||'_admin_'||command,table_name,command,
    case when command='insert' then 'with check((select bbs_private.is_admin()))' when command='update' then 'using((select bbs_private.is_admin())) with check((select bbs_private.is_admin()))' else 'using((select bbs_private.is_admin()))' end);
  end loop;
 end loop;
 foreach table_name in array array['salespeople','payment_methods'] loop
  execute format('drop policy %I on public.%I',table_name||'_admin_all',table_name);
  execute format('drop policy %I on public.%I',table_name||'_approver_all',table_name);
  foreach command in array array['insert','update','delete'] loop
   execute format('create policy %I on public.%I for %s to authenticated %s',table_name||'_manager_'||command,table_name,command,
    case when command='insert' then 'with check((select bbs_private.can_manage_clients()))' when command='update' then 'using((select bbs_private.can_manage_clients())) with check((select bbs_private.can_manage_clients()))' else 'using((select bbs_private.can_manage_clients()))' end);
  end loop;
 end loop;
end $policies$;

drop policy quotes_admin_all on public.quotes;
drop policy quotes_approver_all on public.quotes;
drop policy quotes_cotizador_read on public.quotes;
drop policy quotes_cotizador_insert on public.quotes;
drop policy quotes_cotizador_update on public.quotes;
drop policy quotes_cotizador_delete on public.quotes;
create policy quotes_role_read on public.quotes for select to authenticated using((select bbs_private.can_manage_clients()) or (created_by=(select auth.uid()) and (select bbs_private.user_role())='cotizador'));
create policy quotes_role_insert on public.quotes for insert to authenticated with check((select bbs_private.can_manage_clients()) or (created_by=(select auth.uid()) and status in ('draft','sent') and (select bbs_private.user_role())='cotizador' and bbs_private.quote_client_exists(client_id,true)));
create policy quotes_role_update on public.quotes for update to authenticated using((select bbs_private.can_manage_clients()) or (created_by=(select auth.uid()) and status in ('draft','sent') and (select bbs_private.user_role())='cotizador')) with check((select bbs_private.can_manage_clients()) or (created_by=(select auth.uid()) and status in ('draft','sent') and (select bbs_private.user_role())='cotizador' and bbs_private.quote_client_exists(client_id,true)));
create policy quotes_role_delete on public.quotes for delete to authenticated using((select bbs_private.can_manage_clients()) or (created_by=(select auth.uid()) and status in ('draft','sent') and (select bbs_private.user_role())='cotizador'));

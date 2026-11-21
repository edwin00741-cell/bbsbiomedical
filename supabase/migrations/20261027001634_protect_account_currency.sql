-- Existing amounts are expressed in the account's base currency. Changing its
-- label must never reinterpret issued or historical documents as another currency.
create or replace function bbs_private.protect_account_currency() returns trigger
language plpgsql security invoker set search_path='' as $function$
begin
 if new.currency is distinct from old.currency and (
  exists(select 1 from public.quotes) or exists(select 1 from public.invoices)
  or exists(select 1 from public.payments) or exists(select 1 from public.credit_notes)
  or exists(select 1 from public.refunds)
 ) then
  raise exception 'La moneda base no puede cambiar mientras existan documentos. Conserve la moneda de la cuenta para mantener sus importes e historial.';
 end if;
 return new;
end
$function$;
create trigger business_settings_protect_currency before update of currency on public.business_settings
for each row execute function bbs_private.protect_account_currency();
revoke all on function bbs_private.protect_account_currency() from public,anon,authenticated;

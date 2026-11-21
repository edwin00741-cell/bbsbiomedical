begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where is_active and role='super_admin' order by id limit 1),true);
set local role authenticated;
do $test$
declare original_currency text; blocked boolean:=false;
begin
 select currency into original_currency from public.business_settings limit 1;
 if original_currency is null then raise exception 'Expected business settings fixture.'; end if;
 if not exists(select 1 from public.quotes) and not exists(select 1 from public.invoices) and not exists(select 1 from public.payments) and not exists(select 1 from public.credit_notes) and not exists(select 1 from public.refunds) then raise exception 'Expected an account with existing documents.'; end if;
 begin
  update public.business_settings set currency=case when original_currency='USD' then 'EUR' else 'USD' end;
 exception when raise_exception then blocked:=sqlerrm like '%La moneda base no puede cambiar%'; end;
 if not blocked then raise exception 'Account currency changed despite existing documents.'; end if;
 if exists(select 1 from public.business_settings where currency<>original_currency) then raise exception 'Currency guard changed stored values.'; end if;
 -- Saving unrelated settings and the current currency remains available.
 update public.business_settings set currency=currency,invoice_prefix=invoice_prefix;
end $test$;
rollback;

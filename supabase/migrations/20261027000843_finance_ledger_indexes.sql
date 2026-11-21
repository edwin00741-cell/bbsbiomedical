-- Idempotency keys are private implementation data. RPC owner access is sufficient;
-- an explicit denial documents the intended absence of Data API access.
create policy finance_requests_internal_only on public.finance_requests for all to authenticated using(false) with check(false);
create index if not exists finance_applications_created_by_idx on public.finance_applications(created_by);
create index if not exists finance_applications_reversed_by_idx on public.finance_applications(reversed_by);
create index if not exists finance_events_actor_id_idx on public.finance_events(actor_id);
create index if not exists recurring_invoices_created_by_idx on public.recurring_invoices(created_by);
-- These duplicate the project's pre-existing FK indexes exactly.
drop index if exists public.payments_client_idx;
drop index if exists public.refunds_payment_idx;

-- Invoice receivables belong to a registered client so they can be settled,
-- credited and refunded through the same client ledger.
do $migration$
declare definition text;
 before_pattern text:=$$if v_client_id is not null then$$;
 after_pattern text:=$$if v_kind='invoice' and v_client_id is null then raise exception 'Seleccione un cliente registrado para la factura.'; end if;
  if v_client_id is not null then$$;
begin
 select pg_get_functiondef('public.save_commercial_document(jsonb,uuid,timestamptz,uuid,uuid,boolean)'::regprocedure) into definition;
 if (length(definition)-length(replace(definition,before_pattern,'')))/length(before_pattern)<>1 then raise exception 'Expected commercial client validation was not found.'; end if;
 execute replace(definition,before_pattern,after_pattern);
end $migration$;

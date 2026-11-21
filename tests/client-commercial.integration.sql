begin;
do $test$
declare
  v_client uuid := gen_random_uuid();
  v_number text := 'QA-CLIENT-' || gen_random_uuid()::text;
  v_balance numeric;
begin
  insert into public.clients(id, name) values (v_client, 'QA transaccional clientes');
  insert into public.invoices(invoice_number, client_id, client_name, seller_name, status, issue_date, due_date, subtotal, total, amount_paid)
    values (v_number, v_client, 'QA transaccional clientes', 'QA', 'sent', '2026-10-26', '2026-11-26', 100, 100, 30);
  select balance into v_balance from public.bbs_client_directory where id = v_client;
  if v_balance <> 70 then raise exception 'Saldo incorrecto: %', v_balance; end if;
  if not exists (select 1 from public.bbs_client_directory where id = v_client and next_due_date = '2026-11-26' and last_invoice_number = v_number) then
    raise exception 'Vencimiento o última factura incorrectos';
  end if;
  begin
    delete from public.clients where id = v_client;
    raise exception 'Borrado de cliente con historial permitido';
  exception when foreign_key_violation then null;
  end;
end
$test$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
set local role authenticated;
do $test$
begin
  if exists(select 1 from public.bbs_client_directory) or exists(select 1 from public.client_groups) or exists(select 1 from public.salespeople) then
    raise exception 'Usuario sin perfil pudo consultar datos comerciales';
  end if;
  begin
    insert into public.client_groups(name) values ('QA acceso no permitido');
    raise exception 'Usuario sin perfil pudo crear grupos';
  exception when insufficient_privilege then null;
  end;
end
$test$;
rollback;


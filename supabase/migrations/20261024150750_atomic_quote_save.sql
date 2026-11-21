create or replace function public.save_quote(
  p_quote jsonb,
  p_items jsonb,
  p_quote_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
  saved_total numeric(12,2);
  issued_on date := (p_quote->>'issue_date')::date;
  valid_through date := (p_quote->>'valid_until')::date;
begin
  if auth.uid() is null or not bbs_private.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if issued_on is null or valid_through is null or valid_through < issued_on then
    raise exception 'La validez no puede ser anterior a la fecha de emision.';
  end if;
  if coalesce(length(btrim(p_quote->>'client_name')), 0) < 2
     or coalesce(length(btrim(p_quote->>'seller_name')), 0) < 2 then
    raise exception 'Cliente y vendedor requeridos.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Agregue al menos un producto o servicio.';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Agregue al menos un producto o servicio.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items)
      as item(description text, quantity numeric, unit_price numeric)
    where coalesce(length(btrim(item.description)), 0) < 2
       or item.quantity is null or item.quantity <= 0
       or item.unit_price is null or item.unit_price < 0
       or item.quantity <> round(item.quantity, 2)
       or item.unit_price <> round(item.unit_price, 2)
  ) then
    raise exception 'Revise descripcion, cantidad y precio de cada linea.';
  end if;

  if p_quote_id is null then
    insert into public.quotes (
      client_id, client_name, client_email, seller_name,
      issue_date, valid_until, project_description, notes, created_by
    ) values (
      nullif(p_quote->>'client_id', '')::uuid,
      btrim(p_quote->>'client_name'), nullif(p_quote->>'client_email', ''),
      btrim(p_quote->>'seller_name'), issued_on, valid_through,
      nullif(p_quote->>'project_description', ''), nullif(p_quote->>'notes', ''), auth.uid()
    ) returning id into saved_id;
  else
    select id into saved_id from public.quotes where id = p_quote_id for update;
    if not found then
      raise exception 'Cotizacion no encontrada.';
    end if;
    update public.quotes set
      client_id = nullif(p_quote->>'client_id', '')::uuid,
      client_name = btrim(p_quote->>'client_name'),
      client_email = nullif(p_quote->>'client_email', ''),
      seller_name = btrim(p_quote->>'seller_name'),
      issue_date = issued_on, valid_until = valid_through,
      project_description = nullif(p_quote->>'project_description', ''),
      notes = nullif(p_quote->>'notes', '')
    where id = saved_id;
    delete from public.quote_items where quote_id = saved_id;
  end if;

  insert into public.quote_items (quote_id, item_id, description, quantity, unit_price, position)
  select saved_id, nullif(entry.value->>'item_id', '')::uuid,
    btrim(entry.value->>'description'), (entry.value->>'quantity')::numeric,
    (entry.value->>'unit_price')::numeric, (entry.ordinality - 1)::int
  from jsonb_array_elements(p_items) with ordinality as entry(value, ordinality);

  select sum(line_total) into saved_total from public.quote_items where quote_id = saved_id;
  update public.quotes set subtotal = saved_total, total = saved_total where id = saved_id;
  insert into public.quote_events (quote_id, actor_id, event_type, note)
  values (saved_id, auth.uid(), case when p_quote_id is null then 'created' else 'updated' end,
    case when p_quote_id is null then 'Cotizacion creada.' else 'Cotizacion editada.' end);
  return saved_id;
end;
$$;

revoke all on function public.save_quote(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.save_quote(jsonb, jsonb, uuid) to authenticated;

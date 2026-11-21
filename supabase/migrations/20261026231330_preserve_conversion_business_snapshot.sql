-- A converted invoice retains the issuer information printed on its source quote.
-- Existing document snapshots keep precedence when editing that invoice later.
do $migration$
declare
  v_definition text;
  v_before text := $$v_business:=coalesce(nullif(v_existing->'business_snapshot','null'::jsonb),jsonb_strip_nulls$$;
  v_after text := $$v_business:=coalesce(nullif(v_existing->'business_snapshot','null'::jsonb),nullif(v_source->'business_snapshot','null'::jsonb),jsonb_strip_nulls$$;
begin
  select pg_get_functiondef('public.save_commercial_document(jsonb,uuid,timestamp with time zone,uuid,uuid,boolean)'::regprocedure)
    into v_definition;
  if strpos(v_definition,v_before)=0 then
    raise exception 'Expected commercial snapshot assignment was not found.';
  end if;
  execute replace(v_definition,v_before,v_after);
end
$migration$;

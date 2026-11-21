-- Keep privileged implementations out of the API schema. Both retain their
-- authenticated administrator checks, transaction locks and original signatures.
alter function public.bbs_finance_command(jsonb,uuid) set schema bbs_private;
alter function public.undo_commercial_import(uuid) set schema bbs_private;
alter function bbs_private.undo_commercial_import(uuid) security definer;
revoke all on function bbs_private.bbs_finance_command(jsonb,uuid),bbs_private.undo_commercial_import(uuid) from public,anon;
grant execute on function bbs_private.bbs_finance_command(jsonb,uuid),bbs_private.undo_commercial_import(uuid) to authenticated;

create function public.bbs_finance_command(p_command jsonb,p_request_id uuid) returns uuid
language sql security invoker set search_path='' as $$
 select bbs_private.bbs_finance_command(p_command,p_request_id);
$$;
create function public.undo_commercial_import(p_batch uuid) returns void
language sql security invoker set search_path='' as $$
 select bbs_private.undo_commercial_import(p_batch);
$$;
revoke all on function public.bbs_finance_command(jsonb,uuid),public.undo_commercial_import(uuid) from public,anon;
grant execute on function public.bbs_finance_command(jsonb,uuid),public.undo_commercial_import(uuid) to authenticated;

-- Browser previews carry the version they inspected. Refuse overwrites when
-- either client or item changed before the confirmed import reaches the server.
do $migration$
declare definition text;
 before_pattern text:=$$if v_id is not null and not p_overwrite then raise exception$$;
 after_pattern text:=$$if v_id is not null and nullif(v_row->>'_import_version','') is not null and (v_before->>'updated_at')::timestamptz is distinct from (v_row->>'_import_version')::timestamptz then raise exception 'Fila %: otro usuario modificó el registro. Vuelva a revisar el archivo.',v_position;end if;
   if v_id is not null and not p_overwrite then raise exception$$;
begin
 select pg_get_functiondef('public.import_commercial_batch(text,text,jsonb,boolean,uuid)'::regprocedure) into definition;
 if (length(definition)-length(replace(definition,before_pattern,'')))/length(before_pattern)<>2 then raise exception 'Expected two import overwrite guards.'; end if;
 execute replace(definition,before_pattern,after_pattern);
end $migration$;

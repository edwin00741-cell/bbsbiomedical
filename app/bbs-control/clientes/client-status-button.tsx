"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommercialClient, setClientActive, type ClientActionResult } from "./actions";
import type { CommercialClient } from "../../../lib/bbs-control/client-commercial";
export function ClientStatusButton({ client }: { client: Pick<CommercialClient, "id" | "name" | "updated_at" | "is_active"> }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (_: ClientActionResult, data: FormData) => {
    const result = await setClientActive(data);
    if (!result.error) router.refresh();
    return result;
  }, { error: "" });
  return <form action={action}>
    <input type="hidden" name="client_id" value={client.id} /><input type="hidden" name="version" value={client.updated_at} />
    <input type="hidden" name="active" value={String(!client.is_active)} />
    <button disabled={pending} onClick={(event) => { if (!window.confirm(`¿${client.is_active ? "Desactivar" : "Activar"} cliente «${client.name}»?`)) event.preventDefault(); }}>
      {pending ? "Guardando…" : client.is_active ? "Desactivar" : "Activar"}
    </button>
    {state.error ? <p role="alert" className="bbs-catalog-error">{state.error}</p> : null}
  </form>;
}

export function ClientDeleteButton({ client, returnTo }: {
  client: Pick<CommercialClient, "id" | "name" | "updated_at">; returnTo: string;
}) {
  const [state, action, pending] = useActionState(async (_: ClientActionResult, data: FormData) => deleteCommercialClient(data), { error: "" });
  return <form action={action}>
    <input type="hidden" name="client_id" value={client.id} /><input type="hidden" name="version" value={client.updated_at} />
    <input type="hidden" name="return_to" value={returnTo} />
    <button disabled={pending} className="bbs-danger" onClick={(event) => {
      if (!window.confirm(`¿Borrar cliente «${client.name}»? Esta acción no se puede deshacer.`)) event.preventDefault();
    }}>{pending ? "Borrando…" : "Borrar"}</button>
    {state.error ? <p role="alert" className="bbs-catalog-error">{state.error}</p> : null}
  </form>;
}

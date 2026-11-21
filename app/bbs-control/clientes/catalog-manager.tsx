"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClientCatalog, saveClientCatalog, type ClientActionResult } from "./actions";
import type { ClientCatalog } from "../../../lib/bbs-control/client-commercial";

type Kind = "group" | "salesperson" | "payment_method";
const titles = { group: "grupo", salesperson: "vendedor", payment_method: "método de pago" };

function CatalogEditor({ kind, record, onSaved, onCancel }: {
  kind: Kind; record?: ClientCatalog; onSaved: (entry: ClientCatalog) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(record?.name || "");
  const [state, action, pending] = useActionState(async (_: ClientActionResult, data: FormData) => {
    const result = await saveClientCatalog(data);
    if (result.entry) onSaved(result.entry);
    return result;
  }, { error: "" });
  return <form action={action} className="bbs-catalog-editor" aria-busy={pending}>
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={record?.id || ""} />
    <label>Nombre del {titles[kind]}:<input className="bbs-input" name="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} autoFocus /></label>
    {state.error ? <p className="bbs-message bbs-message-error" role="alert">{state.error}</p> : null}
    <div className="bbs-form-actions"><button className="bbs-button bbs-button-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
      <button type="button" className="bbs-button" disabled={pending} onClick={onCancel}>Cancelar</button></div>
  </form>;
}

export function CatalogManager({ kind, records, onCreated }: { kind: Kind; records: ClientCatalog[]; onCreated?: (entry: ClientCatalog) => void }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<ClientCatalog | "new" | null>(null);
  const [feedback, setFeedback] = useState<ClientActionResult>({ error: "" });
  const [pending, setPending] = useState(false);
  const filtered = records.filter((record) => record.name.toLocaleLowerCase("es").includes(keyword.toLocaleLowerCase("es")));
  return <div>
    <form className="bbs-filters" onSubmit={(event) => event.preventDefault()}><label>Palabra clave:<input className="bbs-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></label>
      <button type="button" className="bbs-button bbs-button-primary" onClick={() => { setFeedback({ error: "" }); setEditing("new"); }}>Nuevo {titles[kind]}</button></form>
    {feedback.error || feedback.success ? <p className={`bbs-message ${feedback.error ? "bbs-message-error" : "bbs-message-success"}`} role={feedback.error ? "alert" : "status"}>{feedback.error || feedback.success}</p> : null}
    {editing ? <CatalogEditor key={editing === "new" ? "new" : editing.id} kind={kind} record={editing === "new" ? undefined : editing}
      onCancel={() => setEditing(null)} onSaved={(entry) => {
        const created = editing === "new";
        setEditing(null); setFeedback({ error: "", success: "Registro guardado." }); router.refresh();
        if (created) onCreated?.(entry);
      }} /> : null}
    <div className="bbs-table-scroll"><table className="bbs-table"><thead><tr><th>Nombre</th><th>Acción</th></tr></thead><tbody>
      {kind === "group" && !keyword ? <tr><td>Predeterminado</td><td>Grupo de clientes sin asignación</td></tr> : null}
      {filtered.map((record) => <tr key={record.id}><td>{record.name}</td><td><div className="bbs-inline-actions">
        <button type="button" className="bbs-button" onClick={() => setEditing(record)}>Editar</button>
        {kind !== "payment_method" ? <button type="button" className="bbs-button" disabled={pending} onClick={async () => {
          if (!window.confirm(`¿Borrar ${titles[kind]} «${record.name}»?`)) return;
          setPending(true);
          try { const data = new FormData(); data.set("kind", kind); data.set("id", record.id);
            const result = await deleteClientCatalog(data); setFeedback(result); if (!result.error) router.refresh();
          } finally { setPending(false); }
        }}>Borrar</button> : null}</div></td></tr>)}
      {!filtered.length && (kind !== "group" || keyword) ? <tr><td className="bbs-empty" colSpan={2}>No se encontraron registros.</td></tr> : null}
    </tbody></table></div>
  </div>;
}

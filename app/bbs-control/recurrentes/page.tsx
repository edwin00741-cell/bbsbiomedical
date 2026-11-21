import Link from "next/link";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../components";
import { getRecurrences, recurrenceInterval } from "../../../lib/bbs-control/recurrence";
import { requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
import { param, type SearchParams } from "../../../lib/bbs-control/list-filters";
import { RunRecurrencesForm } from "./forms";
import "./recurrence.css";
export const dynamic = "force-dynamic";
export default async function RecurrencesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser(), params = searchParams ? await searchParams : {};
  const page = Math.max(1, Math.min(100000, Math.floor(Number(param(params, "page")) || 1))), keyword = param(params, "keyword").trim().slice(0, 160);
  let data;
  try { data = await getRecurrences(page, keyword); } catch { return <BackOfficeShell user={user}><PageHeader eyebrow="Facturas" title="Facturas recurrentes" /><DataError /></BackOfficeShell>; }
  const pages = Math.max(1, Math.ceil(data.count / 20));
  const pageUrl = (value: number) => `/bbs-control/recurrentes?${new URLSearchParams({ page: String(value), keyword })}`;
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Facturas" title="Facturas recurrentes" action={<><Link className="bbs-button" href="/bbs-control/facturas">Facturas</Link><Link className="bbs-button bbs-button-primary" href="/bbs-control/recurrentes/nueva">Nueva programación</Link></>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <p>{data.scheduler.installed ? "Emisión automática activa. Las programaciones pendientes se revisan cada 15 minutos." : "La emisión automática requiere activar el programador. Puede generar las pendientes con el botón de esta página."}</p>
    {!data.scheduler.installed && data.scheduler.installation_error ? <p className="bbs-message bbs-message-error">{data.scheduler.installation_error}</p> : null}
    <RunRecurrencesForm />
    <form className="bbs-filters"><label>Nombre:<input className="bbs-input" name="keyword" defaultValue={keyword} maxLength={160} /></label><button className="bbs-button bbs-button-primary">Buscar</button></form>
    <div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 850 }}><thead><tr><th>Nombre</th><th>Cliente</th><th>Intervalo</th><th>Próxima emisión</th><th>Última fecha</th><th>Generadas</th><th>Estado</th><th>Acción</th></tr></thead>
      <tbody>{data.rows.length ? data.rows.map((row) => <tr key={row.id}><td><Link href={`/bbs-control/recurrentes/${row.id}`}>{row.name}</Link></td><td>{row.client_name}</td><td>{recurrenceInterval(row)}</td><td>{row.status === "completed" ? "—" : row.next_run_date}</td><td>{row.end_date || "Sin límite"}</td><td>{row.run_count}</td><td>{row.status === "active" ? "Activa" : row.status === "paused" ? "Pausada" : "Finalizada"}{row.last_error ? <p className="bbs-field-hint">Requiere revisión</p> : null}</td><td><Link className="bbs-button" href={`/bbs-control/recurrentes/${row.id}`}>Ver / Editar</Link></td></tr>) : <tr><td colSpan={8} className="bbs-empty">No hay programaciones.</td></tr>}</tbody></table></div>
    <div className="bbs-pagination"><span>{data.count} programaciones. Página {page} de {pages}</span><div>{page > 1 ? <Link className="bbs-button" href={pageUrl(page - 1)}>Anterior</Link> : null}{page < pages ? <Link className="bbs-button" href={pageUrl(page + 1)}>Siguiente</Link> : null}</div></div>
  </BackOfficeShell>;
}

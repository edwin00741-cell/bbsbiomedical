import Link from "next/link";
import { z } from "zod";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "../../components";
import { getRecurrence, recurrenceInterval } from "../../../../lib/bbs-control/recurrence";
import { requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";
import { panamaToday, type SearchParams } from "../../../../lib/bbs-control/list-filters";
import { money } from "../../../../lib/bbs-control/format";
import { RecurrenceForm } from "../forms";
import "../recurrence.css";
export const dynamic = "force-dynamic";
export default async function RecurrencePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser(), { id } = await params;
  let data;
  try { data = z.uuid().safeParse(id).success ? await getRecurrence(id) : null; } catch { data = null; }
  if (!data?.recurrence) return <BackOfficeShell user={user}><PageHeader eyebrow="Facturas recurrentes" title="Programación no disponible" /><DataError>No se pudo cargar la programación.</DataError><Link className="bbs-button" href="/bbs-control/recurrentes">Volver</Link></BackOfficeShell>;
  const row = data.recurrence;
  return <BackOfficeShell user={user}><PageHeader eyebrow="Facturas recurrentes" title={row.name} action={<Link className="bbs-button" href="/bbs-control/recurrentes">Volver al listado</Link>} />
    <FlashMessage searchParams={searchParams} />
    <section className="bbs-card"><dl className="bbs-detail-grid"><div><dt>Cliente</dt><dd>{row.document_snapshot.client_name}</dd></div><div><dt>Intervalo</dt><dd>{recurrenceInterval(row)}</dd></div><div><dt>Primera emisión</dt><dd>{row.start_date}</dd></div><div><dt>Próxima emisión</dt><dd>{row.status === "completed" ? "Finalizada" : row.next_run_date}</dd></div><div><dt>Total por factura</dt><dd>{money(row.document_snapshot.total)}</dd></div><div><dt>Facturas generadas</dt><dd>{row.run_count}</dd></div></dl><Link className="bbs-button" href={`/bbs-control/facturas/${row.source_invoice_id}`}>Ver factura de origen</Link></section>
    {row.last_error ? <p className="bbs-message bbs-message-error" role="alert">La programación se pausó: {row.last_error}. Corrija la causa y vuelva a activarla.</p> : null}
    <h2 className="my-5">Programación</h2><RecurrenceForm key={row.updated_at} recurrence={row} today={panamaToday()} />
    <h2 className="my-5">Historial de emisiones</h2><div className="bbs-table-scroll"><table className="bbs-table"><thead><tr><th>Fecha programada</th><th>Factura</th><th>Total</th><th>Estado</th></tr></thead><tbody>{data.runs.length ? data.runs.map((run) => <tr key={run.id}><td>{run.scheduled_date}</td><td><Link href={`/bbs-control/facturas/${run.invoice_id}`}>{run.invoices?.invoice_number || run.invoice_id}</Link></td><td>{money(run.invoices?.total || 0)}</td><td>{run.invoices?.status || "—"}</td></tr>) : <tr><td className="bbs-empty" colSpan={4}>Todavía no se han generado facturas.</td></tr>}</tbody></table></div>
  </BackOfficeShell>;
}

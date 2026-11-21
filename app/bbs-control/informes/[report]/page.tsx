import Link from "next/link";
import { BackOfficeShell, DataError, PageHeader } from "../../components";
import { ListFilters } from "../../list-controls";
import { RecordDialog } from "../../record-dialog";
import { ReportEmailForm } from "../email-form";
import { getReportData, parseReportId } from "../../../../lib/bbs-control/reports";
import { requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";
import type { SearchParams } from "../../../../lib/bbs-control/list-filters";
import "../reports.css";
export const dynamic = "force-dynamic";
export default async function ReportPage({ params, searchParams }: { params: Promise<{ report: string }>; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser(), route = await params, query = searchParams ? await searchParams : {};
  let data;
  try { data = await getReportData(parseReportId(route.report), query); }
  catch (error) { return <BackOfficeShell user={user}><PageHeader eyebrow="Informes" title="Informe no disponible" /><DataError>{error instanceof Error ? error.message : "No se pudo cargar el informe."}</DataError><Link className="bbs-button" href="/bbs-control/informes">Volver a informes</Link></BackOfficeShell>; }
  const { report, filter } = data;
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === "string" && key !== "email") parameters.set(key, value);
  const exportPath = `/api/bbs-control/reports/${report.id}`;
  const closeHref = `/bbs-control/informes/${report.id}?${parameters}`;
  const emailFormat = query.email === "csv" ? "csv" : "pdf";
  const display = (value: string | number | undefined, format?: "money" | "number") => value === undefined ? "" : format === "money" ? new Intl.NumberFormat("es-PA", { style: "currency", currency: report.currency }).format(Number(value)) : format === "number" ? new Intl.NumberFormat("es-PA", { maximumFractionDigits: 2 }).format(Number(value)) : String(value);
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow="Informes" title={report.title} action={<Link className="bbs-button" href="/bbs-control/informes">Todos los informes</Link>} />
    <ListFilters key={parameters.toString()} period={filter.period} start={filter.start} end={filter.end} keyword={filter.keyword} today={filter.today}>
      {report.id !== "inventory" ? <><label>Cliente:<select className="bbs-select" name="client" defaultValue={filter.client}><option value="">Todos</option>{data.clients.map((row) => <option value={row.id} key={row.id}>{row.name}</option>)}</select></label><label>Vendedor:<select className="bbs-select" name="seller" defaultValue={filter.seller}><option value="">Todos</option>{data.sellers.map((seller) => <option value={seller} key={seller}>{seller}</option>)}</select></label></> : null}
      {report.id === "quotes" ? <label>Estado:<select className="bbs-select" name="status" defaultValue={filter.status}><option value="">Todos</option><option value="draft">Abiertas</option><option value="sent">Enviadas</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option><option value="expired">Expiradas</option></select></label> : null}
    </ListFilters>
    <div className="bbs-report-tools"><a className="bbs-button" href={`${exportPath}/pdf?${parameters}`}>Guardar PDF</a><a className="bbs-button" href={`${exportPath}/pdf?${parameters}${parameters.size ? "&" : ""}inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a><a className="bbs-button" href={`${exportPath}/csv?${parameters}`}>Guardar como CSV</a><Link className="bbs-button" href={`${closeHref}${parameters.size ? "&" : ""}email=pdf`}>Enviar PDF</Link><Link className="bbs-button" href={`${closeHref}${parameters.size ? "&" : ""}email=csv`}>Enviar CSV</Link></div>
    <p className="bbs-field-hint">{report.period} · {report.rows.length} registros · Moneda {report.currency}</p>
    <div className="bbs-table-scroll bbs-report-table-wrap"><table className="bbs-table bbs-report-table"><thead><tr>{report.columns.map((column) => <th scope="col" key={column.key} className={column.format ? "bbs-money" : undefined}>{column.label}</th>)}</tr></thead>
      <tbody>{report.rows.length ? report.rows.map((row, index) => <tr key={index}>{report.columns.map((column) => <td key={column.key} className={column.format ? "bbs-money" : undefined}>{display(row[column.key], column.format)}</td>)}</tr>) : <tr><td colSpan={report.columns.length} className="bbs-empty">No hay registros con estos filtros.</td></tr>}</tbody>
      <tfoot><tr>{report.columns.map((column, index) => <td className={column.format ? "bbs-money" : undefined} key={column.key}>{report.totals[column.key] === undefined ? index === 0 ? "TOTAL" : "" : display(report.totals[column.key], column.format)}</td>)}</tr></tfoot>
    </table></div><div className="bbs-report-notes">{report.notes.map((note, index) => <p key={index}>{note}</p>)}</div>
    {query.email === "pdf" || query.email === "csv" ? <RecordDialog title={`Enviar ${report.title}`} closeHref={closeHref}><ReportEmailForm mailConfigured={Boolean(process.env.RESEND_API_KEY)} reportId={report.id} title={report.title} filters={Object.fromEntries(parameters)} format={emailFormat} closeHref={closeHref} /></RecordDialog> : null}
  </BackOfficeShell>;
}

import Link from "next/link";
import { z } from "zod";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "./components";
import { ListFilters } from "./list-controls";
import { Pagination } from "./pagination";
import { RowActions } from "./row-actions";
import { ApplyFinanceForm, FinanceCommandForm, PaymentForm, RefundForm } from "./finance-forms";
import { CreditNoteForm } from "./notas-credito/credit-form";
import { FinanceEmailForm } from "./finance-email-form";
import { RecordDialog } from "./record-dialog";
import { getFinanceData } from "../../lib/bbs-control/finance";
import { getCommercialDocument, getDocumentEditorData } from "../../lib/bbs-control/documents";
import { requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import { money } from "../../lib/bbs-control/format";
import { panamaToday, param, parseListFilters, type SearchParams } from "../../lib/bbs-control/list-filters";
import type { FinanceData, FinancePayment, FinanceCredit, FinanceRefund } from "../../lib/bbs-control/finance-types";
import type { CommercialDocument, DocumentEditorData } from "../../lib/bbs-control/document-types";
import "./finance.css";

export type FinanceKind = "payment" | "credit" | "refund";
export const financeModules = {
  payment: { slug: "pagos", title: "Pagos recibidos", singular: "Pago", create: "Nuevo pago", newSlug: "nuevo", api: "payments" },
  credit: { slug: "notas-credito", title: "Notas de crédito", singular: "Nota de crédito", create: "Crear nota de crédito", newSlug: "nueva", api: "credit-notes" },
  refund: { slug: "reembolsos", title: "Reembolsos", singular: "Reembolso", create: "Nuevo reembolso", newSlug: "nuevo", api: "refunds" },
};
const active = (status: string) => !["void", "failed", "cancelled"].includes(status);
const label = (status: string) => status === "void" ? "Anulado" : status === "draft" ? "Borrador" : "Registrado";
const eventLabels: Record<string, string> = { created: "Creado", updated: "Actualizado", voided: "Anulado", applied: "Importe aplicado", unapplied: "Aplicación deshecha", refunded: "Reembolso registrado",
  "payment.create": "Pago registrado", "payment.update": "Pago actualizado", "payment.void": "Pago anulado", "credit.create": "Nota de crédito emitida", "credit.update": "Nota de crédito actualizada", "credit.void": "Nota de crédito anulada", "refund.create": "Reembolso registrado", "refund.void": "Reembolso anulado", "application.apply": "Importe aplicado", "application.unapply": "Aplicación deshecha" };
const rowsFor = (data: FinanceData, kind: FinanceKind) => kind === "payment" ? data.payments : kind === "credit" ? data.credits : data.refunds;
const paymentInvoices = (data: FinanceData, id: string) => Array.from(new Map(data.applications.filter((entry) => entry.source_kind === "payment" && entry.source_id === id && !entry.reversed_at).map((entry) => [entry.invoice_id, entry])).values());

export async function FinanceListPage({ kind, searchParams }: { kind: FinanceKind; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  const config = financeModules[kind];
  let data: FinanceData | null = null;
  let filters = parseListFilters({});
  let error = "";
  try { filters = parseListFilters(params); data = await getFinanceData(); } catch (failure) { error = failure instanceof Error ? failure.message : "No se pudieron cargar los registros."; }
  const keyword = filters.keyword.toLocaleLowerCase("es");
  const status = param(params, "status");
  const clientId = param(params, "client_id");
  const records = data ? rowsFor(data, kind).filter((entry) => (!filters.start || entry.date >= filters.start) && (!filters.end || entry.date <= filters.end)
    && (!clientId || entry.client_id === clientId) && (!status || (status === "active" ? active(entry.status) : entry.status === status))
    && (!keyword || [entry.number, entry.client_name, "reference" in entry ? entry.reference : "", "reason" in entry ? entry.reason : "", "payment_method_name" in entry ? entry.payment_method_name : ""].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(keyword)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)) : [];
  const page = Math.min(filters.page, Math.max(1, Math.ceil(records.length / 20)));
  const shown = records.slice((page - 1) * 20, page * 20);
  const path = `/bbs-control/${config.slug}`;
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow={config.title} title={config.title} action={<>
      {kind === "credit" ? <Link className="bbs-button" href={`${path}/nueva?from_invoice=1`}>Crear a partir de factura</Link> : null}
      <Link className="bbs-button bbs-button-primary" href={`${path}/${config.newSlug}`}>+ {config.create}</Link>
    </>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <ListFilters key={JSON.stringify(params)} {...filters} placeholder="Cliente, número o referencia">
      <label>Estado:<select name="status" className="bbs-select" defaultValue={status}><option value="">Todos</option><option value="active">Registrados</option><option value="void">Anulados</option></select></label>
      {clientId ? <input type="hidden" name="client_id" value={clientId} /> : null}
    </ListFilters>
    {error ? <DataError>{error}</DataError> : <>
      <div className="bbs-table-scroll"><table className="bbs-table bbs-finance-table"><thead><tr>
        <th>Fecha</th><th>Número</th><th>Cliente</th>{kind === "credit" ? <th>Vendedor</th> : <th>Método</th>}
        {kind === "payment" ? <><th>Factura</th><th>Referencia de pago</th></> : kind === "refund" ? <th>Referencia de reembolso</th> : null}
        <th className="bbs-money">{kind === "credit" ? "Total" : "Importe"}</th>{kind !== "refund" ? <th className="bbs-money">Importe no aplicado</th> : null}<th>Estado</th><th>Acción</th>
      </tr></thead><tbody>{shown.length ? shown.map((entry) => <tr key={entry.id}><td className="bbs-nowrap">{entry.date}</td><td><Link href={`${path}/${entry.id}`}>{entry.number}</Link></td><td>{entry.client_name}</td>
        <td>{"document" in entry ? entry.document?.seller_name || "—" : entry.payment_method_name || "—"}</td>
        {kind === "payment" ? <><td>{data ? paymentInvoices(data, entry.id).map((application) => <Link key={application.invoice_id} href={`/bbs-control/facturas/${application.invoice_id}`} className="block">{application.invoice_number}</Link>) : null}</td><td>{"reference" in entry ? entry.reference || "—" : "—"}</td></> : kind === "refund" ? <td>{"reference" in entry ? entry.reference || "—" : "—"}</td> : null}
        <td className="bbs-money">{money("total" in entry ? entry.total : entry.amount)}</td>{"available_amount" in entry ? <td className="bbs-money">{money(entry.available_amount)}</td> : null}<td><span className={`bbs-badge bbs-badge-${entry.status === "void" ? "rejected" : "paid"}`}>{label(entry.status)}</span></td>
        <td><RowActions label={`Acciones de ${entry.number}`}><Link href={`${path}/${entry.id}`}>Ver detalle / Aplicaciones</Link>{kind === "payment" && entry.finance_version === 1 && active(entry.status) ? <Link href={`${path}/${entry.id}/editar`}>Editar</Link> : null}{kind === "credit" && entry.finance_version === 1 && active(entry.status) && "document" in entry && entry.document && entry.applied_amount === 0 && entry.refunded_amount === 0 ? <Link href={`${path}/${entry.id}/editar`}>Editar</Link> : null}<a href={`/api/bbs-control/${config.api}/${entry.id}/pdf`}>Descargar PDF</a><a href={`/api/bbs-control/${config.api}/${entry.id}/pdf?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a><Link href={`${path}/${entry.id}?email=1`}>Correo electrónico</Link></RowActions></td>
      </tr>) : <tr><td className="bbs-empty" colSpan={11}>No hay registros para los filtros seleccionados.</td></tr>}</tbody></table></div>
      <Pagination path={path} params={params} page={page} count={records.length} />
    </>}
  </BackOfficeShell>;
}

export async function FinanceNewPage({ kind, searchParams }: { kind: FinanceKind; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  const config = financeModules[kind];
  let data: FinanceData;
  try { data = await getFinanceData(); } catch { return <BackOfficeShell user={user}><PageHeader eyebrow={config.title} title={config.create} /><DataError>No se pudieron cargar los datos. Intente nuevamente.</DataError></BackOfficeShell>; }
  const clientId = param(params, "client_id");
  const invoiceId = param(params, "invoice_id");
  let creditCatalog: DocumentEditorData | null = null;
  let creditSource: CommercialDocument | null = null;
  let creditError = "";
  if (kind === "credit") {
    try {
      const [catalog, source] = await Promise.all([getDocumentEditorData("invoice"), z.uuid().safeParse(invoiceId).success ? getCommercialDocument("invoice", invoiceId) : Promise.resolve(null)]);
      if (invoiceId && (!source || ["draft", "void"].includes(source.status))) throw new Error("Seleccione una factura emitida y vigente.");
      creditCatalog = catalog; creditSource = source;
    } catch (error) { creditError = error instanceof Error ? error.message : "No se pudo cargar el editor."; }
  }
  return <BackOfficeShell user={user}><PageHeader eyebrow={config.title} title={config.create} action={<Link className="bbs-button" href={`/bbs-control/${config.slug}`}>Volver al listado</Link>} /><FlashMessage searchParams={Promise.resolve(params)} />
    {kind === "payment" ? <PaymentForm data={data} today={panamaToday()} clientId={clientId} invoiceId={invoiceId} /> : kind === "refund" ? <RefundForm data={data} today={panamaToday()} clientId={clientId} paymentId={param(params, "payment_id")} creditId={param(params, "credit_id")} /> : <>
      <form method="get" className="bbs-filters"><label>Crear a partir de factura:<select className="bbs-select" name="invoice_id" defaultValue={invoiceId}><option value="">[Nota de crédito manual]</option>{data.invoices.filter((invoice) => !["draft", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {invoice.client_name} · {money(invoice.total)}</option>)}</select></label><button className="bbs-button">Seleccionar factura</button></form>
      {creditCatalog ? <CreditNoteForm data={data} catalog={creditCatalog} source={creditSource} today={panamaToday()} seller={user.full_name} clientId={clientId} /> : <DataError>{creditError}</DataError>}
    </>}
  </BackOfficeShell>;
}

export async function FinanceDetailPage({ kind, id, edit = false, searchParams }: { kind: FinanceKind; id: string; edit?: boolean; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  const config = financeModules[kind];
  let data: FinanceData | null = null;
  let error = "";
  try { if (z.uuid().safeParse(id).success) data = await getFinanceData(); } catch { error = "No se pudo cargar el documento. Intente nuevamente."; }
  const record = data ? rowsFor(data, kind).find((entry) => entry.id === id) : null;
  if (!record || !data) return <BackOfficeShell user={user}><PageHeader eyebrow={config.title} title="Documento no encontrado" />{error ? <DataError>{error}</DataError> : null}<Link className="bbs-button" href={`/bbs-control/${config.slug}`}>Volver al listado</Link></BackOfficeShell>;
  const payment = kind === "payment" ? record as FinancePayment : null;
  const credit = kind === "credit" ? record as FinanceCredit : null;
  const refund = kind === "refund" ? record as FinanceRefund : null;
  const path = `/bbs-control/${config.slug}/${id}`;
  const pdf = `/api/bbs-control/${config.api}/${id}/pdf`;
  const canMutate = record.finance_version === 1 && active(record.status);
  const canEdit = canMutate && (Boolean(payment) || Boolean(credit?.document && credit.applied_amount === 0 && credit.refunded_amount === 0));
  if (edit && canEdit) {
    let editor;
    if (payment) editor = <PaymentForm data={data} today={panamaToday()} payment={payment} />;
    if (credit?.document) {
      let catalog: DocumentEditorData | null = null;
      try { catalog = await getDocumentEditorData("invoice"); } catch { /* Render the error below. */ }
      editor = catalog ? <CreditNoteForm data={data} catalog={catalog} source={null} credit={credit} today={panamaToday()} seller={user.full_name} /> : <DataError>No se pudo cargar el editor de la nota de crédito.</DataError>;
    }
    return <BackOfficeShell user={user}><PageHeader eyebrow={config.title} title={`Editar ${record.number}`} />{editor || <DataError>Este documento histórico no contiene líneas editables.</DataError>}</BackOfficeShell>;
  }
  const applications = data.applications.filter((entry) => entry.source_kind === kind && entry.source_id === id);
  const events = data.events.filter((entry) => entry.entity_kind === kind && entry.entity_id === id);
  const client = data.clients.find((entry) => entry.id === record.client_id);
  return <BackOfficeShell user={user}><PageHeader eyebrow={config.title} title={`${config.singular} ${record.number}`} action={<>
    {canEdit ? <Link className="bbs-button bbs-button-primary" href={`${path}/editar`}>Editar</Link> : null}<a className="bbs-button" href={pdf}>Descargar PDF</a><a className="bbs-button" href={`${pdf}?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a><Link className="bbs-button" href={`${path}?email=1`}>Correo electrónico</Link>
  </>} /><FlashMessage searchParams={Promise.resolve(params)} />
    {record.finance_version !== 1 ? <p className="bbs-message">Registro histórico. Puede consultar y descargar su comprobante.</p> : null}
    {edit && !canEdit ? <DataError>Este documento tiene aplicaciones o reembolsos, o está anulado. Consulte su historial para gestionar los movimientos.</DataError> : null}
    <section className="bbs-card"><dl className="bbs-detail-grid"><div><dt>Cliente</dt><dd>{record.client_name}</dd></div><div><dt>Fecha</dt><dd>{record.date}</dd></div><div><dt>Estado</dt><dd><span className="bbs-badge">{label(record.status)}</span></dd></div>{"payment_method_name" in record ? <div><dt>Método</dt><dd>{record.payment_method_name || "—"}</dd></div> : null}{"reference" in record ? <div><dt>Referencia</dt><dd>{record.reference || "—"}</dd></div> : null}</dl>
      <dl className="bbs-finance-summary"><div><dt>{credit ? "Total del crédito" : "Importe original"}</dt><dd>{money(credit?.total ?? payment?.amount ?? refund?.amount ?? 0)}</dd></div>{payment || credit ? <><div><dt>Aplicado</dt><dd>{money((payment || credit)!.applied_amount)}</dd></div><div><dt>Reembolsado</dt><dd>{money((payment || credit)!.refunded_amount)}</dd></div><div><dt>Disponible no aplicado</dt><dd>{money((payment || credit)!.available_amount)}</dd></div></> : null}</dl>
      {payment?.notes ? <p className="bbs-finance-note">{payment.notes}</p> : null}{credit?.reason || refund?.reason ? <p className="bbs-finance-note"><strong>Motivo:</strong> {credit?.reason || refund?.reason}</p> : null}
      {credit?.source_invoice_id ? <p className="bbs-finance-source">Factura de origen: <Link href={`/bbs-control/facturas/${credit.source_invoice_id}`}>{data.invoices.find((entry) => entry.id === credit.source_invoice_id)?.invoice_number || "Ver factura"}</Link></p> : null}
      {refund ? <p className="bbs-finance-source">Pago de origen: <Link href={`/bbs-control/pagos/${refund.payment_id}`}>{data.payments.find((entry) => entry.id === refund.payment_id)?.number || "Ver pago"}</Link>{refund.credit_note_id ? <> · Crédito: <Link href={`/bbs-control/notas-credito/${refund.credit_note_id}`}>{data.credits.find((entry) => entry.id === refund.credit_note_id)?.number || "Ver nota"}</Link></> : null}</p> : null}
      {credit?.document ? <><div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 700 }}><thead><tr><th>Cant.</th><th>Descripción</th><th className="bbs-money">Precio unitario</th><th className="bbs-money">Descuento</th><th className="bbs-money">Impuesto</th><th className="bbs-money">Total</th></tr></thead><tbody>{credit.document.items.map((item, index) => <tr key={index}><td>{item.quantity}</td><td className="bbs-finance-note">{item.description}</td><td className="bbs-money">{money(item.unit_price)}</td><td className="bbs-money">{money(item.discount_total)}</td><td className="bbs-money">{money(item.tax_total)}</td><td className="bbs-money">{money(item.line_total)}</td></tr>)}</tbody></table></div><dl className="bbs-invoice-totals"><div><dt>Subtotal</dt><dd>{money(credit.document.subtotal)}</dd></div><div><dt>Descuento</dt><dd>{money(credit.document.discount_total)}</dd></div><div><dt>Envío</dt><dd>{money(credit.document.shipping_amount)}</dd></div><div><dt>Impuestos</dt><dd>{money(credit.document.tax_total)}</dd></div><div><dt>Total</dt><dd>{money(credit.total)}</dd></div></dl>{credit.document.public_notes ? <p className="bbs-finance-note mt-5">Nota pública: {credit.document.public_notes}</p> : null}{credit.document.footer_notes ? <p className="bbs-finance-note mt-5">{credit.document.footer_notes}</p> : null}{credit.document.private_notes ? <p className="bbs-message bbs-finance-note mt-5">Nota privada (solo BBS Control): {credit.document.private_notes}</p> : null}</> : null}
    </section>
    {payment || credit ? <>
      <section className="bbs-finance-history"><h2>Historial de aplicaciones</h2><div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 650 }}><thead><tr><th>Fecha</th><th>Factura</th><th className="bbs-money">Importe</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{applications.length ? applications.map((entry) => <tr key={entry.id}><td>{entry.created_at.slice(0, 10)}</td><td><Link href={`/bbs-control/facturas/${entry.invoice_id}`}>{entry.invoice_number}</Link></td><td className="bbs-money">{money(entry.amount)}</td><td>{entry.reversed_at ? `Deshecha: ${entry.reversal_reason || ""}` : "Aplicada"}</td><td>{!entry.reversed_at && !entry.locked_by_refund && canMutate ? <details><summary className="bbs-button">Deshacer aplicación</summary><FinanceCommandForm kind={kind as "payment" | "credit"} command={{ operation: "application.unapply", application_id: entry.id, reason: "" }} returnId={id} title="Deshacer aplicación" description="Se restauran los saldos del documento y la factura." /></details> : entry.locked_by_refund ? "Vinculada a reembolso" : "—"}</td></tr>) : <tr><td colSpan={5} className="bbs-empty">Sin aplicaciones.</td></tr>}</tbody></table></div></section>
      {canMutate && (payment || credit)!.available_amount > 0 ? <section className="mt-6"><ApplyFinanceForm data={data} source={{ kind: kind as "payment" | "credit", id, client_id: record.client_id, available_amount: (payment || credit)!.available_amount }} /></section> : null}
      {canMutate ? <div className="bbs-finance-toolbar"><Link className="bbs-button" href={`/bbs-control/reembolsos/nuevo?client_id=${record.client_id}&${payment ? "payment_id" : "credit_id"}=${id}`}>Registrar reembolso</Link>{payment ? <Link className="bbs-button" href={`/bbs-control/pagos/nuevo?client_id=${record.client_id}`}>Otro pago</Link> : null}</div> : null}
    </> : null}
    {events.length ? <section className="bbs-finance-history"><h2>Historial del documento</h2><ul>{events.slice(0, 30).map((event) => <li key={event.id} className="py-2 border-b border-gray-200">{event.created_at.slice(0, 16).replace("T", " ")} · {eventLabels[event.event_type] || "Movimiento registrado"}{typeof event.payload.reason === "string" ? ` · ${event.payload.reason}` : ""}</li>)}</ul></section> : null}
    {canMutate ? <details className="bbs-card mt-6"><summary>Anular {config.singular.toLocaleLowerCase("es")}</summary><FinanceCommandForm kind={kind} returnId={id} command={{ operation: kind === "payment" ? "payment.void" : kind === "credit" ? "credit.void" : "refund.void", id, reason: "" }} title="Anular documento" description="El historial se conserva. Debe deshacer antes los movimientos vinculados cuando corresponda." /></details> : null}
    <div className="bbs-finance-toolbar"><Link className="bbs-button" href={`/bbs-control/${config.slug}`}>Volver al listado</Link></div>
    {param(params, "email") === "1" ? <RecordDialog title={`Enviar ${config.singular.toLocaleLowerCase("es")}`} closeHref={path}><FinanceEmailForm mailConfigured={Boolean(process.env.RESEND_API_KEY)} kind={kind} documentId={id} number={record.number} email={credit?.document?.client_email || client?.email || null} closeHref={path} /></RecordDialog> : null}
  </BackOfficeShell>;
}

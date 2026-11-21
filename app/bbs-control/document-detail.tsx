import Link from "next/link";
import { z } from "zod";
import { BackOfficeShell, DataError, FlashMessage, PageHeader } from "./components";
import { RecordDialog } from "./record-dialog";
import { DocumentEmailForm } from "./document-email-form";
import { ActionSubmit } from "./row-actions";
import { duplicateDocument } from "./document-output-actions";
import { updateQuoteStatusAction } from "./actions";
import { getCommercialDocument } from "../../lib/bbs-control/documents";
import { requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import { money } from "../../lib/bbs-control/format";
import { invoiceBalance } from "../../lib/bbs-control/dashboard";
import { param, type SearchParams } from "../../lib/bbs-control/list-filters";
import type { DocumentKind } from "../../lib/bbs-control/document-types";
import { InvoiceLifecycleForm } from "./invoice-lifecycle-form";
import {can} from "../../lib/bbs-control/permissions";

const labels: Record<string, string> = { draft: "Borrador", sent: "Emitida", approved: "Aprobado", rejected: "Rechazado", expired: "Expirado", paid: "Pagada", partial: "Parcial", overdue: "Atrasada", void: "Anulada" };

export async function DocumentDetail({ kind, id, searchParams }: { kind: DocumentKind; id: string; searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser();
  const params = searchParams ? await searchParams : {};
  let document;
  let failed = false;
  try { document = z.uuid().safeParse(id).success ? await getCommercialDocument(kind, id) : null; }
  catch { failed = true; }
  const slug = kind === "quote" ? "cotizaciones" : "facturas";
  if (!document) return <BackOfficeShell user={user}><PageHeader eyebrow="Documentos" title="Documento no encontrado" />
    {failed ? <DataError>No se pudo cargar el documento. Intente nuevamente.</DataError> : null}<Link className="bbs-button" href={`/bbs-control/${slug}`}>Volver al listado</Link></BackOfficeShell>;
  const path = `/bbs-control/${slug}/${id}`;
  const pdfPath = `/api/bbs-control/${kind === "quote" ? "quotes" : "invoices"}/${id}/pdf`;
  const title = kind === "invoice" ? "Prefactura" : document.document_kind === "estimate" ? "Estimado" : "Cotización";
  return <BackOfficeShell user={user}>
    <PageHeader eyebrow={title} title={`${title} ${document.number}`} action={<>
      <Link className="bbs-button bbs-button-primary" href={`${path}/editar`}>Editar</Link>
      <a className="bbs-button" href={pdfPath}>Descargar PDF</a>
      <a className="bbs-button" href={`${pdfPath}?inline=1`} target="_blank" rel="noopener noreferrer">Ver PDF / Imprimir</a>
      {kind === "quote" || !["draft", "void"].includes(document.status) ? <Link className="bbs-button" href={`${path}?email=1`}>Correo electrónico</Link> : null}
      {kind === "quote" && can(user.role,"finance.write") ? <Link className="bbs-button" href={`/bbs-control/facturas/nueva?quote_id=${id}`}>Crear prefactura</Link> : null}
      {kind === "invoice" ? <Link className="bbs-button" href={`/bbs-control/recurrentes/nueva?invoice_id=${id}`}>Crear recurrente</Link> : null}
      {kind === "invoice" && !["draft","void"].includes(document.status) ? <>
        <Link className="bbs-button" href={`/bbs-control/pagos/nuevo?invoice_id=${id}&client_id=${document.client_id || ""}`}>Aplicar pago</Link>
        <Link className="bbs-button" href={`/bbs-control/notas-credito/nueva?invoice_id=${id}`}>Crear nota de crédito</Link>
        <a className="bbs-button" href={`/api/bbs-control/invoices/${id}/delivery-note`}>Nota de entrega</a>
        <a className="bbs-button" href={`/api/bbs-control/invoices/${id}/shipping-label`}>Etiqueta de envío</a>
      </> : null}
    </>} />
    <FlashMessage searchParams={Promise.resolve(params)} />
    <section className="bbs-card">
      <dl className="bbs-detail-grid">
        <div><dt>Cliente</dt><dd>{document.client_name}</dd><dd>{document.client_email || ""}</dd></div>
        <div><dt>Vendedor</dt><dd>{document.seller_name}</dd></div>
        <div><dt>Fecha</dt><dd>{document.issue_date}</dd></div>
        <div><dt>{kind === "invoice" ? "Vencimiento" : "Validez"}</dt><dd>{kind === "invoice" ? document.due_date : document.valid_until}</dd></div>
        <div><dt>Condiciones de pago</dt><dd>{document.payment_terms === "cod" ? "Contra entrega (COD)" : `Pago en ${document.payment_terms_days} días`}</dd></div>
        <div><dt>Método</dt><dd>{document.payment_method_name || "—"}</dd></div>
        <div><dt>Estado</dt><dd><span className={`bbs-badge bbs-badge-${document.status}`}>{kind === "quote" && document.status === "draft" ? "Abierto" : labels[document.status] || document.status}</span></dd></div>
        <div><dt>Correo</dt><dd>{document.emailed_at ? "Enviado" : "Sin envío registrado"}</dd></div>
        <div><dt>Dirección de facturación</dt><dd className="whitespace-pre-wrap">{document.billing_address || "—"}</dd></div>
        <div><dt>Dirección de envío</dt><dd className="whitespace-pre-wrap">{document.shipping_address || "—"}</dd></div>
        {document.purchase_order ? <div><dt>Orden de compra</dt><dd>{document.purchase_order}</dd></div> : null}
        {document.tax_exempt ? <div><dt>Impuestos</dt><dd>Cliente exento</dd></div> : null}
      </dl>
      {document.source_worksheet_id ? <p className="mb-4"><Link className="bbs-button" href={`/bbs-control/hojas-trabajo/${document.source_worksheet_id}`}>Ver hoja de trabajo {document.source_worksheet_number || "(HT)"}</Link></p> : null}
      {document.source_quote_id ? <p className="mb-4"><Link className="bbs-button" href={`/bbs-control/cotizaciones/${document.source_quote_id}`}>Ver cotización de origen</Link></p> : null}
      {document.project_description ? <p className="mb-5 whitespace-pre-wrap">{document.project_description}</p> : null}
      <div className="bbs-table-scroll"><table className="bbs-table" style={{ minWidth: 760 }}>
        <thead><tr><th>Cant.</th><th>Cód. artículo</th><th>Descripción</th><th>Precio unitario</th><th>Descuento</th><th>Impuesto</th><th>Total</th></tr></thead>
        <tbody>{document.items.map((item, index) => <tr key={index}><td>{item.quantity}</td><td>{item.sku || "—"}</td><td className="whitespace-pre-wrap">{item.description}</td>
          <td className="bbs-money">{money(item.unit_price)}</td><td className="bbs-money">{money(item.discount_total)}</td><td className="bbs-money">{money(item.tax_total)}</td><td className="bbs-money">{money(item.line_total)}</td></tr>)}</tbody>
      </table></div>
      <dl className="bbs-invoice-totals">
        <div><dt>Subtotal</dt><dd>{money(document.subtotal)}</dd></div>
        {document.discount_total ? <div><dt>Descuento</dt><dd>−{money(document.discount_total)}</dd></div> : null}
        {document.shipping_amount ? <div><dt>Envío</dt><dd>{money(document.shipping_amount)}</dd></div> : null}
        <div><dt>Impuestos</dt><dd>{money(document.tax_total)}</dd></div><div><dt><strong>Total</strong></dt><dd><strong>{money(document.total)}</strong></dd></div>
        {kind === "invoice" ? <><div><dt>Pagado</dt><dd>{money(document.amount_paid)}</dd></div>{Number(document.amount_credited)>0?<div><dt>Créditos aplicados</dt><dd>{money(Number(document.amount_credited))}</dd></div>:null}<div><dt>Saldo</dt><dd>{money(invoiceBalance(document))}</dd></div></> : null}
      </dl>
      {document.public_notes ? <section className="mt-6"><h2>Nota pública</h2><p className="whitespace-pre-wrap">{document.public_notes}</p></section> : null}
      {document.footer_notes ? <section className="mt-6"><h2>Nota al pie</h2><p className="whitespace-pre-wrap">{document.footer_notes}</p></section> : null}
      {document.private_notes ? <section className="bbs-message mt-6"><h2>Nota privada</h2><p className="whitespace-pre-wrap">{document.private_notes}</p><small>Solo visible dentro de BBS Control.</small></section> : null}
    </section>
    <div className="bbs-inline-actions mt-5">
      <form action={duplicateDocument}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="document_id" value={id} /><ActionSubmit>Crear duplicado</ActionSubmit></form>
      <Link className="bbs-button" href={`/bbs-control/${slug}`}>Volver al listado</Link>
    </div>
    {kind === "invoice" ? <section className="bbs-card mt-5"><InvoiceLifecycleForm invoiceId={id} version={document.updated_at} status={document.status} amountPaid={document.amount_paid} amountCredited={document.amount_credited} /></section> : null}
    {kind === "quote" && can(user.role,"quotes.approve") ? <form className="bbs-filters" action={updateQuoteStatusAction}><input type="hidden" name="quote_id" value={id} />
      <label>Estado:<select className="bbs-select" name="status" defaultValue={document.status}><option value="draft">Abierto</option><option value="sent">Enviado</option><option value="approved">Aprobado</option><option value="rejected">Rechazado</option><option value="expired">Expirado</option></select></label><button className="bbs-button">Actualizar estado</button></form> : null}
    {param(params, "email") === "1" ? <RecordDialog title={`Enviar ${title.toLocaleLowerCase("es")}`} closeHref={path}>
      <DocumentEmailForm mailConfigured={Boolean(process.env.RESEND_API_KEY)} kind={kind} documentId={id} number={document.number} email={document.client_email} closeHref={path} />
    </RecordDialog> : null}
  </BackOfficeShell>;
}

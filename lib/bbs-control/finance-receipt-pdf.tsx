import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Image as PdfImage, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { FinanceData, FinancePayment, FinanceCredit, FinanceRefund } from "./finance-types";

export type FinancePdfKind = "payment" | "credit" | "refund";
const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/bbs-primary-horizontal-color.png")).toString("base64")}`;
const titles = { payment: "RECIBO DE PAGO", credit: "NOTA DE CRÉDITO", refund: "REEMBOLSO" };
const styles = StyleSheet.create({
  page: { paddingTop: 113, paddingBottom: 53, paddingHorizontal: 36, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.35, color: "#222" },
  logo: { position: "absolute", top: 29, left: 36, width: 164, height: 43, objectFit: "contain" },
  title: { position: "absolute", top: 25, right: 36, width: 330, fontSize: 20, lineHeight: 1.25, textAlign: "right" },
  number: { position: "absolute", top: 55, right: 36, width: 300, fontSize: 11, lineHeight: 1.3, textAlign: "right" },
  date: { position: "absolute", top: 73, right: 36, width: 300, textAlign: "right" },
  rule: { position: "absolute", top: 94, left: 36, right: 36, height: 1 },
  footer: { position: "absolute", left: 36, right: 36, fontSize: 8, lineHeight: 1.3, color: "#777", textAlign: "right" },
  company: { marginBottom: 16, color: "#555" },
  companyName: { fontSize: 11, color: "#222", marginBottom: 4 },
  info: { flexDirection: "row", gap: 22, marginBottom: 15 },
  cell: { flex: 1 },
  label: { fontSize: 8, color: "#666", marginBottom: 4 },
  customer: { fontSize: 11, marginBottom: 4 },
  metadata: { borderTop: "0.5 solid #ddd", paddingTop: 10, marginBottom: 16 },
  paragraph: { marginBottom: 14 },
  head: { flexDirection: "row", paddingVertical: 7, backgroundColor: "#808080", color: "#fff" },
  row: { flexDirection: "row", paddingVertical: 7, borderBottom: "0.5 solid #ddd" },
  stripe: { backgroundColor: "#f4f4f4" },
  qty: { width: "7%", paddingHorizontal: 4 },
  description: { width: "40%", paddingHorizontal: 4 },
  unit: { width: "14%", paddingHorizontal: 4, textAlign: "right" },
  discount: { width: "10%", paddingHorizontal: 4, textAlign: "right" },
  tax: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  total: { width: "17%", paddingHorizontal: 4, textAlign: "right" },
  invoice: { width: "45%", paddingHorizontal: 5 },
  appDate: { width: "25%", paddingHorizontal: 5 },
  appAmount: { width: "30%", textAlign: "right", paddingHorizontal: 5 },
  totals: { marginTop: 18, marginLeft: "auto", width: 270, borderTop: "0.5 solid #ccc", paddingTop: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
  totalLabel: { flex: 1, color: "#555" },
  totalValue: { width: 108, textAlign: "right" },
  grand: { fontSize: 13, borderTop: "1 solid #415779", marginTop: 4, paddingTop: 8 },
  note: { marginTop: 18, borderTop: "0.5 solid #ddd", paddingTop: 11 },
  void: { position: "absolute", top: 330, left: 70, right: 70, fontSize: 64, color: "#ccc", opacity: 0.25, transform: "rotate(-27deg)", textAlign: "center" },
});

function parts(description: string) {
  const tokens = description.split(/\s+/).flatMap((word) => word.match(/.{1,45}/gu) || [""]);
  const chunks: string[] = [];
  let chunk = "";
  for (const token of tokens) { if (chunk.length + token.length > 450) { chunks.push(chunk); chunk = ""; } chunk += `${chunk ? " " : ""}${token}`; }
  if (chunk || !chunks.length) chunks.push(chunk);
  return chunks;
}

export function findFinanceRecord(data: FinanceData, kind: FinancePdfKind, id: string) {
  return (kind === "payment" ? data.payments : kind === "credit" ? data.credits : data.refunds).find((record) => record.id === id);
}

export function FinanceReceiptPdf({ data, kind, id }: { data: FinanceData; kind: FinancePdfKind; id: string }) {
  const record = findFinanceRecord(data, kind, id);
  if (!record) throw new Error("Documento no encontrado.");
  const payment = kind === "payment" ? record as FinancePayment : null;
  const credit = kind === "credit" ? record as FinanceCredit : null;
  const refund = kind === "refund" ? record as FinanceRefund : null;
  const document = credit?.document;
  const settings = document?.business_snapshot || ("business_snapshot" in record ? record.business_snapshot : null) || data.settings;
  const preferences = settings.document_preferences;
  const paper = preferences?.page_size || "LETTER";
  const height = paper === "A4" ? 841.89 : paper === "LEGAL" ? 1008 : 792;
  const accent = /^#[0-9a-f]{6}$/i.test(preferences?.accent_color || "") ? preferences!.accent_color! : "#415779";
  const money = (value: number) => new Intl.NumberFormat("es-PA", { style: "currency", currency: settings.currency || "USD" }).format(value || 0);
  const date = (value: string) => preferences?.date_format === "day-first" ? value.slice(0, 10).split("-").reverse().join("/") : value.slice(0, 10);
  const client = data.clients.find((entry) => entry.id === record.client_id);
  const applicationMap = new Map<string, { invoice_number: string; amount: number; created_at: string }>();
  for (const entry of data.applications.filter((entry) => entry.source_kind === kind && entry.source_id === id && !entry.reversed_at)) {
    const previous = applicationMap.get(entry.invoice_id);
    applicationMap.set(entry.invoice_id, { invoice_number: entry.invoice_number, amount: Math.round(((previous?.amount || 0) + entry.amount) * 100) / 100, created_at: entry.created_at });
  }
  const applications = Array.from(applicationMap, ([invoice_id, entry]) => ({ ...entry, invoice_id }));
  const items = document?.items.flatMap((item, index) => parts(item.description).map((description, part) => ({ item, index, description, part }))) || [];
  const summary = credit ? [["Subtotal", document?.subtotal ?? credit.total], ["Descuento", -(document?.discount_total || 0)], ["Envío", document?.shipping_amount || 0], ["Impuestos", document?.tax_total || 0]] as const : [];
  return <Document title={`${titles[kind]} ${record.number}`} author={settings.business_name}><Page size={paper} style={styles.page}>
    {record.status === "void" ? <Text fixed style={styles.void}>ANULADO</Text> : null}
    <PdfImage fixed src={logo} style={styles.logo} /><Text fixed style={[styles.title, { color: accent }]}>{titles[kind]}</Text><Text fixed style={styles.number}>{record.number}</Text><Text fixed style={styles.date}>Fecha: {date(record.date)}</Text><View fixed style={[styles.rule, { backgroundColor: accent }]} />
    <Text fixed style={[styles.footer, { top: height - 35 }]} render={({ pageNumber, totalPages }) => `${record.number} | Página ${pageNumber} de ${totalPages}`} />
    <View style={styles.company}><Text style={styles.companyName}>{settings.business_name}</Text>{settings.tax_id ? <Text>Identificación fiscal: {settings.tax_id}</Text> : null}{settings.address ? <Text>{settings.address}</Text> : null}<Text>{[settings.phone, settings.email, settings.website].filter(Boolean).join(" | ")}</Text></View>
    <View style={styles.info}><View style={styles.cell}><Text style={styles.label}>CLIENTE</Text><Text style={styles.customer}>{record.client_name}</Text>{document?.billing_address ? <Text>{document.billing_address}</Text> : null}{document?.client_email || client?.email ? <Text>{document?.client_email || client?.email}</Text> : null}</View>{document?.shipping_address ? <View style={styles.cell}><Text style={styles.label}>ENVIAR A</Text><Text>{document.shipping_address}</Text></View> : null}</View>
    <View style={[styles.info, styles.metadata]}>
      {payment || refund ? <><View style={styles.cell}><Text style={styles.label}>MÉTODO</Text><Text>{(payment || refund)!.payment_method_name || "Sin especificar"}</Text></View><View style={styles.cell}><Text style={styles.label}>REFERENCIA</Text><Text>{(payment || refund)!.reference || "-"}</Text></View></> : null}
      {document ? <><View style={styles.cell}><Text style={styles.label}>VENDEDOR</Text><Text>{document.seller_name || "-"}</Text></View><View style={styles.cell}><Text style={styles.label}>CONDICIONES COMERCIALES</Text><Text>{document.payment_terms === "cod" ? "Contra entrega (COD)" : `Pago en ${document.payment_terms_days} días`}</Text>{document.payment_method_name ? <Text>{document.payment_method_name}</Text> : null}</View></> : null}
      {credit?.source_invoice_id ? <View style={styles.cell}><Text style={styles.label}>FACTURA DE ORIGEN</Text><Text>{data.invoices.find((entry) => entry.id === credit.source_invoice_id)?.invoice_number || credit.source_invoice_id}</Text></View> : null}
      {refund ? <View style={styles.cell}><Text style={styles.label}>PAGO DE ORIGEN</Text><Text>{data.payments.find((entry) => entry.id === refund.payment_id)?.number || "Pago"}</Text>{refund.credit_note_id ? <Text>{data.credits.find((entry) => entry.id === refund.credit_note_id)?.number || "Nota de crédito"}</Text> : null}</View> : null}
    </View>
    {credit?.reason || refund?.reason ? <Text style={styles.paragraph}>Motivo: {credit?.reason || refund?.reason}</Text> : null}
    {document?.project_description ? <Text style={styles.paragraph}>{document.project_description}</Text> : null}
    {document?.tax_exempt ? <Text style={styles.paragraph}>Cliente exento de impuestos.</Text> : null}
    {credit && items.length ? <><View style={styles.head} fixed><Text style={styles.qty}>Cant.</Text><Text style={styles.description}>Descripción</Text><Text style={styles.unit}>P. unitario</Text><Text style={styles.discount}>Desc.</Text><Text style={styles.tax}>Impuesto</Text><Text style={styles.total}>Total</Text></View>
      {items.map(({ item, index, description, part }) => <View key={`${index}-${part}`} wrap={false} style={index % 2 ? [styles.row, styles.stripe] : styles.row}><Text style={styles.qty}>{part ? "" : item.quantity}</Text><Text style={styles.description}>{part ? "(continuación) " : ""}{description}</Text><Text style={styles.unit}>{part ? "" : money(item.unit_price)}</Text><Text style={styles.discount}>{part ? "" : document?.discount_mode === "line" ? `${item.discount_percent}%` : "-"}</Text><Text style={styles.tax}>{part ? "" : document?.tax_exempt ? "Exento" : `${item.tax_rate}%`}</Text><Text style={styles.total}>{part ? "" : money(item.line_total)}</Text></View>)}</> : null}
    {payment && applications.length ? <><Text style={{ marginTop: 18, marginBottom: 8 }}>Aplicaciones vigentes</Text><View style={styles.head} fixed><Text style={styles.invoice}>Factura</Text><Text style={styles.appDate}>Fecha de aplicación</Text><Text style={styles.appAmount}>Importe</Text></View>{applications.map((entry) => <View key={entry.invoice_id} wrap={false} style={styles.row}><Text style={styles.invoice}>{entry.invoice_number}</Text><Text style={styles.appDate}>{date(entry.created_at)}</Text><Text style={styles.appAmount}>{money(entry.amount)}</Text></View>)}</> : null}
    <View style={styles.totals} wrap={false}>{summary.map(([name, value]) => <View style={styles.totalRow} key={name}><Text style={styles.totalLabel}>{name}</Text><Text style={styles.totalValue}>{money(value)}</Text></View>)}
      <View style={[styles.totalRow, styles.grand, { color: accent, borderTopColor: accent }]}><Text style={{ flex: 1 }}>{credit ? "Total crédito" : payment ? "Importe recibido" : "Importe reembolsado"}</Text><Text style={styles.totalValue}>{money(credit?.total ?? payment?.amount ?? refund?.amount ?? 0)}</Text></View>
      {payment || credit ? <><View style={styles.totalRow}><Text style={styles.totalLabel}>Aplicado</Text><Text style={styles.totalValue}>{money((payment || credit)!.applied_amount)}</Text></View><View style={styles.totalRow}><Text style={styles.totalLabel}>Reembolsado</Text><Text style={styles.totalValue}>{money((payment || credit)!.refunded_amount)}</Text></View><View style={styles.totalRow}><Text style={styles.totalLabel}>Disponible no aplicado</Text><Text style={styles.totalValue}>{money((payment || credit)!.available_amount)}</Text></View></> : null}
    </View>
    {document?.public_notes || payment?.notes ? <View style={styles.note}><Text style={styles.label}>NOTA PÚBLICA</Text><Text>{document?.public_notes || payment?.notes}</Text></View> : null}
    {document?.footer_notes || preferences?.payment_footer ? <Text style={styles.note}>{document?.footer_notes || preferences?.payment_footer}</Text> : null}
  </Page></Document>;
}

export async function renderFinanceReceiptPdf(data: FinanceData, kind: FinancePdfKind, id: string) {
  return renderToBuffer(<FinanceReceiptPdf data={data} kind={kind} id={id} />);
}

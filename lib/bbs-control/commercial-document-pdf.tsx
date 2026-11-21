import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Image as PdfImage, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { BusinessSettings } from "./types";
import type { CommercialDocument } from "./document-types";

const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/bbs-primary-horizontal-color.png")).toString("base64")}`;
const fallbackBusiness: BusinessSettings = {
  id: "default", business_name: "Biomedical Business and Service", legal_name: null,
  address: null, email: null, phone: null, currency: "USD", quote_prefix: "BBS", default_validity_days: 30,
};

function currency(value: number, code: string) {
  try { return new Intl.NumberFormat("es-PA", { style: "currency", currency: code }).format(Number(value) || 0); }
  catch { return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(value) || 0); }
}

function percent(value: number) {
  return `${new Intl.NumberFormat("es-PA", { maximumFractionDigits: 4 }).format(Number(value) || 0)}%`;
}

/** Split very long item descriptions into printable continuation rows without losing text. */
function descriptionParts(description: string) {
  const paragraphs = description.split(/\r?\n/);
  const parts: string[] = [];
  let part = "";
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    for (const word of words) {
      // Breaking extremely long tokens avoids pushing the table outside the page.
      const tokens = word.match(/.{1,48}/gu) || [""];
      for (const token of tokens) {
        if (part.length + token.length > 450) { parts.push(part.trimEnd()); part = ""; }
        part += `${part && !part.endsWith("\n") ? " " : ""}${token}`;
      }
    }
    part += "\n";
    if (part.split("\n").length > 8) { parts.push(part.trimEnd()); part = ""; }
  }
  if (part.trim() || !parts.length) parts.push(part.trimEnd());
  return parts;
}

const styles = StyleSheet.create({
  page: { paddingTop: 111, paddingBottom: 53, paddingHorizontal: 36, backgroundColor: "#fff", color: "#222", fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.35 },
  headerRule: { position: "absolute", top: 94, left: 36, right: 36, height: 1, backgroundColor: "#415779" },
  logo: { position: "absolute", top: 29, left: 36, width: 164, height: 43, objectFit: "contain" },
  title: { position: "absolute", top: 25, right: 36, width: 300, textAlign: "right", fontSize: 22, lineHeight: 1.25, color: "#415779" },
  number: { position: "absolute", top: 55, right: 36, width: 300, textAlign: "right", fontSize: 11, lineHeight: 1.3, color: "#444" },
  issueDate: { position: "absolute", top: 73, right: 36, width: 300, textAlign: "right", fontSize: 9 },
  company: { marginBottom: 15, fontSize: 9, color: "#555", maxWidth: 340 },
  companyName: { color: "#222", fontSize: 11, marginBottom: 3 },
  addresses: { flexDirection: "row", gap: 24, marginBottom: 15 },
  address: { width: "50%" },
  label: { color: "#6b6b6b", fontSize: 8, marginBottom: 4 },
  customer: { fontSize: 11, marginBottom: 3 },
  terms: { borderTop: "0.5 solid #ddd", paddingTop: 10, marginBottom: 14, flexDirection: "row", gap: 14 },
  termsCell: { flex: 1 },
  project: { marginBottom: 14, lineHeight: 1.4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#808080", color: "#fff", paddingVertical: 7 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #ddd", paddingVertical: 7 },
  stripe: { backgroundColor: "#f4f4f4" },
  qty: { width: "7%", paddingHorizontal: 4 },
  code: { width: "10%", paddingHorizontal: 4, fontSize: 8 },
  description: { width: "31%", paddingHorizontal: 4 },
  unit: { width: "14%", paddingHorizontal: 4, textAlign: "right" },
  discount: { width: "10%", paddingHorizontal: 4, textAlign: "right" },
  tax: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  amount: { width: "16%", paddingHorizontal: 4, textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 255, borderTop: "0.5 solid #ccc", paddingTop: 7 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 3 },
  totalLabel: { flex: 1, color: "#555" },
  totalValue: { textAlign: "right", width: 100 },
  grandTotal: { borderTop: "1 solid #415779", color: "#415779", fontSize: 13, paddingTop: 7, marginTop: 5 },
  note: { marginTop: 18, paddingTop: 11, borderTop: "0.5 solid #ddd", lineHeight: 1.45 },
  // A fixed top keeps the footer anchored during automatic page splitting.
  footer: { position: "absolute", top: 757, left: 36, right: 36, fontSize: 8, lineHeight: 1.3, color: "#777", textAlign: "right" },
  draft: { position: "absolute", top: 335, left: 90, right: 90, fontSize: 65, color: "#cccccc", opacity: 0.22, transform: "rotate(-27deg)", textAlign: "center" },
});

export function CommercialDocumentPdf({ document, business }: { document: CommercialDocument; business?: BusinessSettings }) {
  const settings = document.business_snapshot || business || fallbackBusiness;
  const prefs = settings.document_preferences || {};
  const title = document.kind === "invoice" ? "PREFACTURA" : document.document_kind === "estimate" ? prefs.estimate_title || "ESTIMADO" : prefs.quote_title || "COTIZACIÓN";
  const accent = prefs.accent_color || "#0e7490";
  const pageSize = prefs.page_size || "LETTER";
  const footerTop = pageSize === "A4" ? 807 : pageSize === "LEGAL" ? 973 : 757;
  const printedDate = (value: string) => prefs.date_format === "day-first" ? value.split("-").reverse().join("/") : value;
  const money = (value: number) => currency(value, settings.currency || "USD");
  const terms = document.payment_terms === "cod" ? "Contra entrega (COD)" : `Pago en ${document.payment_terms_days} días`;
  const discountLabel = document.discount_mode === "percent" ? `Descuento (${percent(document.discount_value)})`
    : document.discount_mode === "line" ? "Descuentos por artículo" : "Descuento";
  const rows = document.items.flatMap((item, index) => descriptionParts(item.description).map((description, part) => ({ item, index, description, part })));

  return <Document title={`${title} ${document.number}`} author={settings.business_name}>
    <Page size={pageSize} style={styles.page}>
      {document.kind === "invoice" && document.status === "draft" ? <Text style={styles.draft} fixed>BORRADOR</Text> : null}
      <PdfImage src={logo} style={styles.logo} fixed />
      <Text style={[styles.title,{color:accent}]} fixed>{title}</Text><Text style={styles.number} fixed>{document.number}</Text>
      <Text style={styles.issueDate} fixed>Fecha: {printedDate(document.issue_date)}</Text><View style={[styles.headerRule,{backgroundColor:accent}]} fixed />
      <Text style={[styles.footer,{top:footerTop}]} fixed render={({ pageNumber, totalPages }) => `${document.number} | Página ${pageNumber} de ${totalPages}`} />
      <View style={styles.company}><Text style={styles.companyName}>{settings.legal_name || settings.business_name}</Text>{settings.tax_id ? <Text>Registro: {settings.tax_id}</Text> : null}{settings.website ? <Text>{settings.website}</Text> : null}
        {settings.address ? <Text>{settings.address}</Text> : null}
        {[settings.phone, settings.email].filter(Boolean).length ? <Text>{[settings.phone, settings.email].filter(Boolean).join(" | ")}</Text> : null}
      </View>
      {document.source_worksheet_number ? <Text style={styles.note}>Hoja de trabajo: {document.source_worksheet_number}</Text> : null}
      <View style={styles.addresses}><View style={styles.address}><Text style={styles.label}>FACTURAR A</Text>
        <Text style={styles.customer}>{document.client_name}</Text>{document.billing_address ? <Text>{document.billing_address}</Text> : null}
        {document.client_email ? <Text>{document.client_email}</Text> : null}
      </View><View style={styles.address}><Text style={styles.label}>ENVIAR A</Text>
        <Text>{document.shipping_address || document.billing_address || document.client_name}</Text>
      </View></View>
      <View style={styles.terms}>
        <View style={styles.termsCell}><Text style={styles.label}>CONDICIONES DE PAGO</Text><Text>{terms}</Text>
          {document.payment_method_name ? <Text>{document.payment_method_name}</Text> : null}</View>
        <View style={styles.termsCell}><Text style={styles.label}>{document.kind === "invoice" ? "VENCIMIENTO" : "VÁLIDA HASTA"}</Text><Text>{printedDate(document.kind === "invoice" ? document.due_date : document.valid_until)}</Text></View>
        <View style={styles.termsCell}>{prefs.show_seller !== false ? <><Text style={styles.label}>VENDEDOR</Text><Text>{document.seller_name || "-"}</Text></> : null}
          {document.purchase_order ? <Text>Orden: {document.purchase_order}</Text> : null}</View>
      </View>
      {document.project_description ? <Text style={styles.project}>{document.project_description}</Text> : null}
      {document.tax_exempt ? <Text style={{ marginBottom: 8 }}>Cliente exento de impuestos.</Text> : null}
      <View style={[styles.tableHeader,{backgroundColor:prefs.template === "minimal" ? accent : "#808080"}]} fixed><Text style={styles.qty}>Cant.</Text><Text style={styles.code}>{prefs.show_sku === false ? "" : "Código"}</Text><Text style={styles.description}>Descripción</Text>
        <Text style={styles.unit}>Precio unitario</Text><Text style={styles.discount}>Desc.</Text><Text style={styles.tax}>{prefs.show_tax === false ? "" : "Impuesto"}</Text><Text style={styles.amount}>Total</Text></View>
      {rows.map(({ item, index, description, part }) => <View key={`${index}-${part}`} style={index % 2 && prefs.stripe_rows !== false ? [styles.row, styles.stripe] : styles.row} wrap={false}>
        <Text style={styles.qty}>{part ? "" : item.quantity}</Text><Text style={styles.code}>{part || prefs.show_sku === false ? "" : item.sku || "-"}</Text>
        <Text style={styles.description}>{part ? "(continuación) " : ""}{description}</Text><Text style={styles.unit}>{part ? "" : money(item.unit_price)}</Text>
        <Text style={styles.discount}>{part ? "" : document.discount_mode === "line" && item.discount_percent ? percent(item.discount_percent) : "-"}</Text>
        <Text style={styles.tax}>{part || prefs.show_tax === false ? "" : document.tax_exempt ? "Exento" : percent(item.tax_rate)}</Text><Text style={styles.amount}>{part ? "" : money(item.line_total)}</Text>
      </View>)}
      <View style={styles.totals} wrap={false}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{money(document.subtotal)}</Text></View>
        {document.discount_total ? <View style={styles.totalRow}><Text style={styles.totalLabel}>{discountLabel}</Text><Text style={styles.totalValue}>-{money(document.discount_total)}</Text></View> : null}
        {document.shipping_amount ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Envío</Text><Text style={styles.totalValue}>{money(document.shipping_amount)}</Text></View> : null}
        <View style={styles.totalRow}><Text style={styles.totalLabel}>{document.tax_exempt ? "Impuestos (exento)" : "Impuestos"}</Text><Text style={styles.totalValue}>{money(document.tax_total)}</Text></View>
        <View style={[styles.totalRow, styles.grandTotal,{color:accent,borderTopColor:accent}]}><Text style={{ flex: 1 }}>Total</Text><Text style={styles.totalValue}>{money(document.total)}</Text></View>
        {document.kind === "invoice" && (document.amount_paid > 0 || Number(document.amount_credited) > 0) ? <>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Pagado</Text><Text style={styles.totalValue}>{money(document.amount_paid)}</Text></View>
          {Number(document.amount_credited)>0 ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Créditos aplicados</Text><Text style={styles.totalValue}>{money(Number(document.amount_credited))}</Text></View> : null}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Saldo pendiente</Text><Text style={styles.totalValue}>{money(Math.max(0, document.total - document.amount_paid - Number(document.amount_credited || 0)))}</Text></View>
        </> : null}
      </View>
      {document.kind === "invoice" ? <Text style={styles.note}>PREFACTURA · Documento comercial interno. La factura fiscal se emite por separado.</Text> : null}
      {document.public_notes ? <View style={styles.note}><Text style={styles.label}>NOTA PÚBLICA</Text><Text>{document.public_notes}</Text></View> : null}
      {document.footer_notes ? <Text style={styles.note}>{document.footer_notes}</Text> : null}
    </Page>
  </Document>;
}

export async function renderCommercialDocumentPdf(document: CommercialDocument, business?: BusinessSettings) {
  return renderToBuffer(<CommercialDocumentPdf document={document} business={business} />);
}

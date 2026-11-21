import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Image as PdfImage, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { CommercialDocument } from "./document-types";
import type { BusinessSettings } from "./types";

const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/bbs-primary-horizontal-color.png")).toString("base64")}`;
const styles = StyleSheet.create({
  page: { paddingTop: 100, paddingHorizontal: 36, paddingBottom: 55, fontFamily: "Helvetica", fontSize: 10, color: "#222", lineHeight: 1.4 },
  logo: { position: "absolute", left: 36, top: 27, width: 162, height: 42, objectFit: "contain" },
  title: { position: "absolute", right: 36, top: 28, width: 310, textAlign: "right", fontSize: 20, color: "#415779" },
  number: { position: "absolute", right: 36, top: 58, width: 310, textAlign: "right", fontSize: 10 },
  rule: { height: 1, backgroundColor: "#415779", position: "absolute", top: 85, left: 36, right: 36 },
  addresses: { flexDirection: "row", gap: 25, marginBottom: 18 },
  address: { width: "50%" }, label: { color: "#666", fontSize: 8, marginBottom: 5 }, name: { fontSize: 12, marginBottom: 5 },
  info: { marginBottom: 18 }, head: { flexDirection: "row", backgroundColor: "#808080", color: "white", paddingVertical: 7 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #ddd", paddingVertical: 8 }, stripe: { backgroundColor: "#f4f4f4" },
  qty: { width: "12%", paddingHorizontal: 6 }, code: { width: "19%", paddingHorizontal: 6 }, description: { width: "69%", paddingHorizontal: 6 },
  signatures: { marginTop: 45, flexDirection: "row", gap: 35 }, signature: { width: "50%", borderTop: "0.5 solid #555", paddingTop: 7, fontSize: 9 },
  footer: { position: "absolute", top: 756, left: 36, right: 36, textAlign: "right", fontSize: 8, color: "#777" },
  labelPage: { padding: 21, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 },
  labelLogo: { width: 142, height: 36, objectFit: "contain", marginBottom: 15 },
  labelFrom: { paddingBottom: 13, borderBottom: "1 solid #415779", marginBottom: 17, fontSize: 9 },
  labelTo: { fontSize: 12, marginBottom: 15 }, labelClient: { fontSize: 15, marginBottom: 7 },
  labelReference: { marginTop: 13, paddingTop: 9, borderTop: "0.5 solid #bbb", fontSize: 9 },
});

function parts(value: string) {
  const lines: string[] = [];
  // Bound each printable row so even a 5,000-character description can continue across pages.
  const words = value.replace(/([^\s]{40})/gu, "$1 ").split(/\s+/);
  let line = "";
  for (const word of words) {
    if (line.length + word.length > 370) { lines.push(line); line = ""; }
    line += `${line ? " " : ""}${word}`;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
export function DeliveryNotePdf({ document, business }: { document: CommercialDocument; business: BusinessSettings }) {
  const company = document.business_snapshot || business;
  const rows = document.items.flatMap((item, index) => parts(item.description).map((description, part) => ({ item, index, description, part })));
  return <Document title={`Nota de entrega ${document.number}`} author={company.business_name}><Page size="LETTER" style={styles.page}>
    <PdfImage src={logo} style={styles.logo} fixed /><Text style={styles.title} fixed>NOTA DE ENTREGA</Text>
    <Text style={styles.number} fixed>Factura {document.number} | {document.issue_date}</Text><View style={styles.rule} fixed />
    <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${document.number} | Página ${pageNumber} de ${totalPages}`} />
    <View style={styles.addresses}><View style={styles.address}><Text style={styles.label}>ENTREGADO POR</Text><Text style={styles.name}>{company.business_name}</Text>{company.address ? <Text>{company.address}</Text> : null}{company.phone ? <Text>{company.phone}</Text> : null}{company.email ? <Text>{company.email}</Text> : null}</View>
      <View style={styles.address}><Text style={styles.label}>ENTREGAR A</Text><Text style={styles.name}>{document.client_name}</Text><Text>{document.shipping_address || document.billing_address || "Dirección no indicada"}</Text>{document.client_email ? <Text>{document.client_email}</Text> : null}</View></View>
    <View style={styles.info}><Text>Vendedor: {document.seller_name}</Text>{document.purchase_order ? <Text>Orden de compra: {document.purchase_order}</Text> : null}</View>
    <View style={styles.head} fixed><Text style={styles.qty}>Cantidad</Text><Text style={styles.code}>Código</Text><Text style={styles.description}>Descripción</Text></View>
    {rows.map(({ item, index, description, part }) => <View key={`${index}-${part}`} style={index % 2 ? [styles.row, styles.stripe] : styles.row} wrap={false}><Text style={styles.qty}>{part ? "" : item.quantity}</Text><Text style={styles.code}>{part ? "" : item.sku || "-"}</Text><Text style={styles.description}>{part ? "(continuación) " : ""}{description}</Text></View>)}
    <View style={styles.signatures} wrap={false}><Text style={styles.signature}>Entregado por / Fecha</Text><Text style={styles.signature}>Recibido por / Firma / Fecha</Text></View>
  </Page></Document>;
}
export function ShippingLabelPdf({ document, business }: { document: CommercialDocument; business: BusinessSettings }) {
  const company = document.business_snapshot || business;
  return <Document title={`Etiqueta de envío ${document.number}`} author={company.business_name}><Page size={[288, 432]} style={styles.labelPage}>
    <PdfImage src={logo} style={styles.labelLogo} /><View style={styles.labelFrom}><Text style={styles.label}>REMITENTE</Text><Text>{company.business_name}</Text>{company.address ? <Text>{company.address}</Text> : null}{company.phone ? <Text>{company.phone}</Text> : null}</View>
    <View style={styles.labelTo}><Text style={styles.label}>DESTINATARIO</Text><Text style={styles.labelClient}>{document.client_name}</Text><Text>{document.shipping_address || document.billing_address || "Dirección no indicada"}</Text></View>
    <View style={styles.labelReference}><Text>Factura: {document.number}</Text>{document.purchase_order ? <Text>Orden: {document.purchase_order}</Text> : null}<Text>Fecha: {document.issue_date}</Text></View>
  </Page></Document>;
}
export async function renderDeliveryPdf(document: CommercialDocument, business: BusinessSettings, kind: "delivery-note" | "shipping-label") {
  return renderToBuffer(kind === "delivery-note" ? <DeliveryNotePdf document={document} business={business} /> : <ShippingLabelPdf document={document} business={business} />);
}

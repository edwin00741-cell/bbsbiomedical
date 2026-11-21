import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Image as PdfImage, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { invoiceBalance } from "./dashboard";
import { money } from "./format";
import type { BusinessSettings } from "./types";
import type { StatementClient, StatementInvoice } from "./client-statement";

const brandLogo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/bbs-primary-horizontal-color.png")).toString("base64")}`;

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 55, fontFamily: "Helvetica", fontSize: 10, color: "#252525", lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #415779", paddingBottom: 14, marginBottom: 20 },
  logo: { width: 155, marginBottom: 8 },
  business: { width: "55%", fontSize: 9, color: "#555" },
  title: { fontSize: 21, color: "#415779", textAlign: "right" },
  date: { textAlign: "right", marginTop: 8, fontSize: 9 },
  client: { marginBottom: 18 },
  name: { fontSize: 13, marginBottom: 5 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #ddd", padding: "7 4" },
  tableHead: { backgroundColor: "#808080", color: "white" },
  invoice: { width: "18%" }, dateCol: { width: "16%" }, amount: { width: "16.5%", textAlign: "right" },
  empty: { padding: 20, color: "#666", textAlign: "center" },
  total: { marginTop: 18, marginLeft: "auto", width: 230, flexDirection: "row", justifyContent: "space-between", fontSize: 13, color: "#415779" },
  footerNote: { marginTop: 25, paddingTop: 12, borderTop: "0.5 solid #ddd", fontSize: 9 },
  pageNumber: { position: "absolute", bottom: 25, left: 40, right: 40, textAlign: "right", fontSize: 8, color: "#777" },
});

export async function renderClientStatementPdf(client: StatementClient, invoices: StatementInvoice[], business: BusinessSettings, date: string) {
  const balance = invoices.reduce((sum, invoice) => sum + Math.round(invoiceBalance(invoice) * 100), 0) / 100;
  return renderToBuffer(<Document title={`Estado de cuenta — ${client.name}`} author={business.business_name}>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}><View style={styles.business}>
        <PdfImage src={brandLogo} style={styles.logo} />
        <Text>{business.business_name}</Text><Text>{business.address || ""}</Text><Text>{business.phone || ""}</Text><Text>{business.email || ""}</Text>
      </View><View><Text style={styles.title}>Estado de cuenta</Text><Text style={styles.date}>Fecha: {date}</Text></View></View>
      <View style={styles.client}><Text style={styles.name}>{client.name}</Text><Text>{client.contact_name || ""}</Text><Text>{client.address || ""}</Text><Text>{client.email || ""}</Text><Text>{client.public_notes || ""}</Text></View>
      <View style={[styles.row, styles.tableHead]} fixed><Text style={styles.invoice}>Factura</Text><Text style={styles.dateCol}>Vencimiento</Text><Text style={styles.amount}>Total</Text><Text style={styles.amount}>Pagado</Text><Text style={styles.amount}>Crédito</Text><Text style={styles.amount}>Saldo</Text></View>
      {invoices.map((invoice) => <View key={invoice.id} style={styles.row} wrap={false}><Text style={styles.invoice}>{invoice.invoice_number}</Text><Text style={styles.dateCol}>{invoice.due_date}</Text>
        <Text style={styles.amount}>{money(Number(invoice.total))}</Text><Text style={styles.amount}>{money(Number(invoice.amount_paid))}</Text><Text style={styles.amount}>{money(Number(invoice.amount_credited || 0))}</Text><Text style={styles.amount}>{money(invoiceBalance(invoice))}</Text></View>)}
      {!invoices.length ? <Text style={styles.empty}>No hay facturas emitidas para este cliente.</Text> : null}
      <View style={styles.total}><Text>Saldo pendiente</Text><Text>{money(balance)}</Text></View>
      {client.statement_footer ? <Text style={styles.footerNote}>{client.statement_footer}</Text> : null}
      <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </Page>
  </Document>);
}

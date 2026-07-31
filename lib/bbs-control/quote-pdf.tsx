import path from "node:path";
import { readFileSync } from "node:fs";
/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { displayDate, money } from "./format";
import type { BusinessSettings, QuoteWithItems } from "./types";
import { defaultBusinessSettings } from "./quotes";

function pngDataUri(filePath: string) {
  return `data:image/png;base64,${readFileSync(filePath).toString("base64")}`;
}

const brandLogo = pngDataUri(path.join(process.cwd(), "public", "brand", "bbs-primary-horizontal-white.png"));
const watermarkLogo = pngDataUri(path.join(process.cwd(), "public", "brand", "bbs-symbol-color.png"));

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 0,
  },
  header: {
    backgroundColor: "#075985",
    color: "#ffffff",
    paddingHorizontal: 42,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    width: 164,
    height: 42,
    objectFit: "contain",
  },
  address: {
    marginTop: 12,
    width: 225,
    lineHeight: 1.4,
    color: "#dff7ff",
  },
  headerContact: {
    marginTop: 6,
    width: 225,
    lineHeight: 1.4,
    color: "#ffffff",
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 14,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  metaLabel: {
    color: "#a5f3fc",
    width: 72,
  },
  metaValue: {
    width: 130,
    color: "#ffffff",
  },
  body: {
    position: "relative",
    paddingHorizontal: 42,
    paddingVertical: 26,
  },
  watermark: {
    position: "absolute",
    top: 155,
    left: 135,
    width: 315,
    opacity: 0.055,
  },
  divider: {
    height: 2,
    backgroundColor: "#075985",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  projectDescription: {
    borderColor: "#bae6fd",
    borderRadius: 6,
    borderWidth: 1,
    color: "#334155",
    lineHeight: 1.45,
    marginBottom: 18,
    minHeight: 54,
    padding: 9,
  },
  table: {
    borderColor: "#0f172a",
    borderWidth: 1,
    marginTop: 10,
  },
  tableHeader: {
    backgroundColor: "#075985",
    color: "#ffffff",
    flexDirection: "row",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 24,
  },
  productCell: {
    borderColor: "#0f172a",
    borderRightWidth: 1,
    padding: 6,
    width: "49%",
  },
  qtyCell: {
    borderColor: "#0f172a",
    borderRightWidth: 1,
    padding: 6,
    textAlign: "center",
    width: "20%",
  },
  priceCell: {
    borderColor: "#0f172a",
    borderRightWidth: 1,
    padding: 6,
    textAlign: "right",
    width: "15%",
  },
  totalCell: {
    padding: 6,
    textAlign: "right",
    width: "16%",
  },
  rowBorder: {
    borderBottomColor: "#0f172a",
    borderBottomWidth: 1,
  },
  totalRow: {
    flexDirection: "row",
    marginLeft: "69%",
  },
  totalLabel: {
    backgroundColor: "#075985",
    color: "#ffffff",
    padding: 7,
    width: "48%",
    fontWeight: 700,
  },
  totalValue: {
    backgroundColor: "#075985",
    color: "#ffffff",
    padding: 7,
    width: "52%",
    textAlign: "right",
    fontWeight: 700,
  },
  validity: {
    marginTop: 12,
    fontSize: 9,
    fontWeight: 700,
  },
  notes: {
    marginTop: 14,
    lineHeight: 1.5,
    color: "#334155",
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 72,
  },
  signature: {
    borderTopColor: "#0f172a",
    borderTopWidth: 1,
    paddingTop: 5,
    width: 170,
    fontSize: 8,
  },
  footerNote: {
    color: "#64748b",
    fontSize: 8,
    marginTop: 16,
    textAlign: "center",
  },
});

export function QuotePdfDocument({
  quote,
  settings = defaultBusinessSettings,
}: {
  quote: QuoteWithItems;
  settings?: BusinessSettings;
}) {
  const rows = quote.items.length ? quote.items : [];
  const blankRows = Array.from({ length: Math.max(0, 8 - rows.length) });
  const address = settings.address || defaultBusinessSettings.address;
  const contact = [settings.phone, settings.email].filter(Boolean).join(" · ");

  return (
    <Document title={`Cotización ${quote.quote_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src={brandLogo} style={styles.logo} />
            <Text style={styles.address}>{address}</Text>
            {contact ? <Text style={styles.headerContact}>{contact}</Text> : null}
          </View>
          <View>
            <Text style={styles.quoteTitle}>COTIZACIÓN #{quote.quote_number}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>FECHA:</Text>
              <Text style={styles.metaValue}>{displayDate(quote.issue_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>VENDEDOR:</Text>
              <Text style={styles.metaValue}>{quote.seller_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>CLIENTE:</Text>
              <Text style={styles.metaValue}>{quote.client_name}</Text>
            </View>
          </View>
        </View>
        <View style={styles.body}>
          <Image src={watermarkLogo} style={styles.watermark} />
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>DESCRIPCIÓN DEL PROYECTO:</Text>
          <Text style={styles.projectDescription}>
            {quote.project_description || "Servicio técnico biomédico."}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.productCell}>PRODUCTO / SERVICIO</Text>
              <Text style={styles.qtyCell}>CANTIDAD</Text>
              <Text style={styles.priceCell}>PRECIO</Text>
              <Text style={styles.totalCell}>TOTAL</Text>
            </View>
            {rows.map((item) => (
              <View key={item.id} style={[styles.tableRow, styles.rowBorder]}>
                <Text style={styles.productCell}>{item.description}</Text>
                <Text style={styles.qtyCell}>{item.quantity}</Text>
                <Text style={styles.priceCell}>{money(item.unit_price)}</Text>
                <Text style={styles.totalCell}>{money(item.line_total)}</Text>
              </View>
            ))}
            {blankRows.map((_, index) => (
              <View key={`blank-${index}`} style={[styles.tableRow, styles.rowBorder]}>
                <Text style={styles.productCell}> </Text>
                <Text style={styles.qtyCell}> </Text>
                <Text style={styles.priceCell}> </Text>
                <Text style={styles.totalCell}> </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(quote.total)}</Text>
          </View>
          <Text style={styles.validity}>
            Cotización válida hasta el {displayDate(quote.valid_until)}.
          </Text>
          {quote.notes ? <Text style={styles.notes}>{quote.notes}</Text> : null}
          <View style={styles.signatures}>
            <Text style={styles.signature}>Firma de Cliente</Text>
            <Text style={styles.signature}>Firma de Vendedor</Text>
          </View>
          <Text style={styles.footerNote}>
            {settings.business_name} · Cotización generada por el panel interno BBS.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotePdfBuffer(
  quote: QuoteWithItems,
  settings?: BusinessSettings,
) {
  return renderToBuffer(<QuotePdfDocument quote={quote} settings={settings} />);
}



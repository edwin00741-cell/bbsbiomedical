import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Image as PdfImage, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReportColumn, ReportResult } from "./reports-types";
import type { BusinessSettings } from "./types";
const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/bbs-primary-horizontal-color.png")).toString("base64")}`;
export function formatReportCell(value: string | number | undefined, column: ReportColumn, currency = "USD") {
  if (value === undefined) return "";
  if (column.format === "money") return new Intl.NumberFormat("es-PA", { style: "currency", currency }).format(Number(value) || 0);
  if (column.format === "number") return new Intl.NumberFormat("es-PA", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  return String(value);
}
const styles = StyleSheet.create({
  page: { paddingTop: 100, paddingBottom: 43, paddingHorizontal: 30, fontFamily: "Helvetica", fontSize: 8, color: "#222", lineHeight: 1.35 },
  logo: { position: "absolute", top: 20, left: 30, width: 160, height: 41, objectFit: "contain" },
  title: { position: "absolute", top: 20, right: 30, width: 570, fontSize: 20, textAlign: "right", color: "#415779" },
  period: { position: "absolute", top: 52, right: 30, width: 570, fontSize: 9, textAlign: "right" },
  rule: { position: "absolute", top: 81, right: 30, left: 30, height: 1, backgroundColor: "#415779" },
  company: { marginBottom: 10 }, head: { flexDirection: "row", backgroundColor: "#808080", color: "#fff", paddingVertical: 7 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #ddd", paddingVertical: 7 }, stripe: { backgroundColor: "#f4f4f4" },
  cell: { paddingHorizontal: 4 }, numeric: { textAlign: "right" }, totals: { flexDirection: "row", backgroundColor: "#e6ebf1", paddingVertical: 8, marginTop: 7 },
  notes: { marginTop: 15, fontSize: 8, lineHeight: 1.45 }, footer: { position: "absolute", top: 568, left: 30, right: 30, textAlign: "right", fontSize: 7, color: "#777" },
});
export function ReportPdf({ report, business }: { report: ReportResult; business: BusinessSettings }) {
  const width = `${100 / report.columns.length}%`;
  const rows = report.rows.flatMap((row, index) => {
    const cells = report.columns.map((column) => formatReportCell(row[column.key], column, report.currency).replace(/([^\s]{35})/gu, "$1 ").match(/[\s\S]{1,230}/gu) || [""]);
    return Array.from({ length: Math.max(...cells.map((cell) => cell.length)) }, (_, part) => ({ index, part, cells: cells.map((cell) => cell[part] || "") }));
  });
  return <Document title={report.title} author={business.business_name}><Page size="A4" orientation="landscape" style={styles.page}>
    <PdfImage src={logo} style={styles.logo} fixed /><Text style={styles.title} fixed>{report.title}</Text><Text style={styles.period} fixed>{report.period}</Text><View style={styles.rule} fixed />
    <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Generado ${report.generated_at} | Página ${pageNumber} de ${totalPages}`} />
    <Text style={styles.company}>{business.business_name} | {report.rows.length} registros | Moneda: {report.currency}</Text>
    <View style={styles.head} fixed>{report.columns.map((column) => <Text key={column.key} style={[styles.cell, { width }, ...(column.format ? [styles.numeric] : [])]}>{column.label}</Text>)}</View>
    {rows.length ? rows.map((row) => <View wrap={false} key={`${row.index}-${row.part}`} style={row.index % 2 ? [styles.row, styles.stripe] : styles.row}>{row.cells.map((cell, index) => <Text key={index} style={[styles.cell, { width }, ...(report.columns[index].format ? [styles.numeric] : [])]}>{cell}</Text>)}</View>) : <Text style={{ marginTop: 15 }}>No hay registros con estos filtros.</Text>}
    <View style={styles.totals} wrap={false}>{report.columns.map((column, index) => <Text key={column.key} style={[styles.cell, { width }, ...(column.format ? [styles.numeric] : [])]}>{report.totals[column.key] === undefined ? index === 0 ? "TOTAL" : "" : formatReportCell(report.totals[column.key], column, report.currency)}</Text>)}</View>
    <View style={styles.notes}>{report.notes.map((note, index) => <Text key={index}>{note}</Text>)}</View>
  </Page></Document>;
}
export async function renderReportPdf(report: ReportResult, business: BusinessSettings) { return renderToBuffer(<ReportPdf report={report} business={business} />); }

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { Module } from "node:module";
const filename = path.resolve("lib/bbs-control/__reports-pdf-verification.cjs");
const compiled = ts.transpileModule(fs.readFileSync("lib/bbs-control/reports-pdf.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
const renderer = new Module(filename); renderer.filename = filename; renderer.paths = Module._nodeModulePaths(path.dirname(filename)); renderer._compile(compiled, filename);
const rows = Array.from({ length: 35 }, (_, index) => ({ date: "2026-10-26", number: `QA-INVOICE-${index + 1}`, client: `CLIENTE${index + 1} de prueba con un nombre comercial largo para verificar ajuste de columnas`, seller: "Vendedor de prueba", status: "Emitida", subtotal: 100, discount: 0, shipping: 0, tax: 7, total: 107, balance: 70, private_notes: "PRIVATE_REPORT_NOTE_MUST_NOT_EXPORT" }));
const report = { id: "invoices", title: "Facturas", generated_at: "2026-10-26T23:00:00Z", period: "2026-10-01 a 2026-10-26", cutoff: "2026-10-26", currency: "USD", rows,
  columns: [["date", "Fecha"], ["number", "Número"], ["client", "Cliente"], ["seller", "Vendedor"], ["status", "Estado"], ["subtotal", "Subtotal", "money"], ["discount", "Descuento", "money"], ["shipping", "Envío", "money"], ["tax", "Impuestos", "money"], ["total", "Total", "money"], ["balance", "Saldo al corte", "money"]].map(([key, label, format]) => ({ key, label, format })),
  totals: { subtotal: 3500, discount: 0, shipping: 0, tax: 245, total: 3745, balance: 2450 }, notes: ["Los importes corresponden a datos sintéticos. El informe utiliza las mismas filas e importes que la tabla y el CSV."] };
const output = path.resolve("tmp/pdfs/reports-verification"); fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "report-wide.pdf"), await renderer.exports.renderReportPdf(report, { business_name: "BBS Empresa de prueba" }));
console.log(`Rendered synthetic wide report in ${output}.`);

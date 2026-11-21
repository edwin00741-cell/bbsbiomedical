// Synthetic PDF fixtures. No database access or email delivery.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { Module } from "node:module";

const filename = path.resolve("lib/bbs-control/__finance-pdf-verification.cjs");
const compiled = ts.transpileModule(fs.readFileSync("lib/bbs-control/finance-receipt-pdf.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
}).outputText;
const renderer = new Module(filename); renderer.filename = filename; renderer.paths = Module._nodeModulePaths(path.dirname(filename)); renderer._compile(compiled, filename);
const business = { id: "qa", business_name: "QA_SNAPSHOT_BBS", legal_name: null, address: "Dirección de la empresa", phone: "+507 0000-0000", email: "empresa@example.invalid", currency: "USD", quote_prefix: "QA", default_validity_days: 30 };
const client = { id: "client", name: "Cliente de prueba de comprobantes", email: "cliente@example.invalid" };
const items = Array.from({ length: 60 }, (_, index) => ({ item_id: null, sku: `ROW-${index + 1}`, description: `ROW-${index + 1}: Servicio de mantenimiento y calibración de equipo biomédico.`, quantity: 1, unit_price: 10, tax_rate: 7, discount_percent: 10, gross_total: 10, discount_total: 1, net_total: 9, tax_total: 0.63, line_total: 9.63 }));
const document = { kind: "invoice", document_kind: "quote", client_id: client.id, client_name: client.name, client_email: client.email, seller_name: "Vendedor guardado", billing_address: "Facturación guardada", shipping_address: "Envío guardado", payment_terms: "days", payment_terms_days: 45, payment_method_name: "Transferencia guardada", tax_exempt: false, issue_date: "2026-10-26", valid_until: "2026-11-26", project_description: "Crédito comercial de prueba", public_notes: "PUBLIC_VISIBLE_FINANCE", private_notes: "PRIVATE_NEVER_EXPORT_FINANCE", footer_notes: "FOOTER_VISIBLE_FINANCE", discount_mode: "line", discount_value: 0, shipping_amount: 20, shipping_tax_rate: 7, subtotal: 600, discount_total: 60, net_subtotal: 540, tax_total: 39.2, shipping_tax_total: 1.4, total: 599.2, items, business_snapshot: business };
const payment = { id: "payment", number: "QA-PAG-001", client_id: client.id, client_name: client.name, amount: 1500, applied_amount: 900, refunded_amount: 0, available_amount: 600, date: "2026-10-26", payment_method_name: "Transferencia guardada", reference: "QA pago", notes: "PUBLIC_VISIBLE_FINANCE", status: "completed", business_snapshot: business };
const credit = { id: "credit", number: "QA-NC-001", client_id: client.id, client_name: client.name, source_invoice_id: "invoice", total: 599.2, applied_amount: 100, refunded_amount: 20, available_amount: 479.2, date: "2026-10-26", reason: "Corrección de servicios", status: "completed", document };
const refund = { id: "refund", number: "QA-RE-001", client_id: client.id, client_name: client.name, payment_id: payment.id, credit_note_id: credit.id, amount: 10, date: "2026-10-26", payment_method_name: "Transferencia guardada", reference: "QA reembolso", reason: "Devolución parcial", status: "void", business_snapshot: business };
const applications = Array.from({ length: 45 }, (_, index) => ({ id: `app-${index}`, source_kind: "payment", source_id: payment.id, invoice_id: `invoice-${index}`, invoice_number: `QA-FAC-${index + 1}`, client_id: client.id, amount: 20, created_at: "2026-10-26T12:00:00Z", reversed_at: null }));
const data = { clients: [client], methods: [], invoices: [{ id: "invoice", invoice_number: "QA-FAC-ORIGEN" }], payments: [payment], credits: [credit], refunds: [refund], applications, events: [], settings: { ...business, business_name: "CURRENT_SETTINGS_MUST_NOT_REPLACE_SNAPSHOT" } };
const output = path.resolve(process.env.BBS_FINANCE_PDF_QA_DIR || "tmp/pdfs/finance-pdf-agent"); fs.mkdirSync(output, { recursive: true });
for (const [kind, id] of [["payment", payment.id], ["credit", credit.id], ["refund", refund.id]]) {
  fs.writeFileSync(path.join(output, `${kind}.pdf`), await renderer.exports.renderFinanceReceiptPdf(data, kind, id));
}
console.log(`Rendered 3 synthetic finance PDFs in ${output}.`);

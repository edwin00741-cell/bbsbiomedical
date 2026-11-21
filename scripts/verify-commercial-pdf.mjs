// Synthetic fixtures only. No database connection or email delivery.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { Module } from "node:module";

const filename = path.resolve("lib/bbs-control/__commercial-pdf-verification.cjs");
const source = fs.readFileSync("lib/bbs-control/commercial-document-pdf.tsx", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true, target: ts.ScriptTarget.ES2020,
} }).outputText;
const renderer = new Module(filename);
renderer.filename = filename;
renderer.paths = Module._nodeModulePaths(path.dirname(filename));
renderer._compile(compiled, filename);

const business = {
  id: "snapshot", business_name: "BBS Snapshot de prueba", legal_name: null,
  address: "Dirección de la empresa guardada", phone: "+507 0000-0000", email: "empresa@example.invalid",
  currency: "USD", quote_prefix: "BBS", default_validity_days: 30,
};
const items = Array.from({ length: 75 }, (_, index) => ({
  item_id: null, sku: `SKU-${index + 1}`,
  description: `Servicio biomédico de prueba ${index + 1}. Calibración y mantenimiento de equipos médicos.`,
  quantity: 1, unit_price: 100, tax_rate: 7, discount_percent: 10,
  gross_total: 100, discount_total: 10, net_total: 90, tax_total: 6.3, line_total: 96.3,
}));
const document = {
  kind: "invoice", document_kind: "quote", client_id: null,
  client_name: "Cliente de prueba para impresión", client_email: "cliente@example.invalid", seller_name: "Vendedor de prueba",
  billing_address: "Dirección de facturación independiente, Panamá", shipping_address: "Dirección de envío independiente, La Chorrera",
  payment_terms: "days", payment_terms_days: 45, payment_method_id: null, payment_method_name: "Transferencia de prueba",
  tax_exempt: false, issue_date: "2026-10-26", valid_until: "2026-11-26", purchase_order: "OC-QA-2026",
  project_description: "Revisión de un documento comercial extenso.", public_notes: "PUBLIC_NOTE_VISIBLE_ABC",
  private_notes: "PRIVATE_NOTE_NEVER_EXPORT_ABC", footer_notes: "PUBLIC_FOOTER_VISIBLE_ABC",
  discount_mode: "line", discount_value: 0, shipping_amount: 20, shipping_tax_rate: 7, items,
  subtotal: 7500, discount_total: 750, net_subtotal: 6750, shipping_tax_total: 1.4, tax_total: 473.9, total: 7243.9,
  id: "qa-document", number: "QA-FACTURA-2026-001", status: "draft",
  updated_at: "2026-10-26T12:00:00Z", created_at: "2026-10-26T12:00:00Z", due_date: "2026-12-10",
  amount_paid: 0, source_quote_id: null, commercial_version: 1, business_snapshot: business,
};

async function main() {
  const output = path.resolve(process.env.BBS_PDF_QA_DIR || "tmp/pdfs/commercial-pdf-agent");
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "invoice-many.pdf"), await renderer.exports.renderCommercialDocumentPdf(document, {
    ...business, business_name: "SHOULD_NOT_REPLACE_SNAPSHOT",
  }));
  const estimate = { ...document, kind: "quote", document_kind: "estimate", number: "QA-ESTIMADO-2026-001",
    items: [{ ...items[0], description: `Descripción larga: ${Array.from({ length: 220 }, (_, index) => `palabra${index}`).join(" ")}` }],
    subtotal: 100, discount_total: 10, net_subtotal: 90, shipping_amount: 0, shipping_tax_total: 0, tax_total: 6.3, total: 96.3,
  };
  fs.writeFileSync(path.join(output, "estimate-long.pdf"), await renderer.exports.renderCommercialDocumentPdf(estimate));
  const exempt = { ...estimate, number: "QA-EXENTO-2026-001", document_kind: "quote", tax_exempt: true,
    items: [{ ...items[0], tax_total: 0, line_total: 90 }], tax_total: 0, total: 90,
  };
  fs.writeFileSync(path.join(output, "quote-exempt.pdf"), await renderer.exports.renderCommercialDocumentPdf(exempt));
  console.log(`Rendered 3 synthetic PDF fixtures in ${output}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

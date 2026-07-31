import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function InvoicesPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Facturas",
        title: "Facturación",
        description: "Estructura para crear, enviar, descargar, imprimir y dar seguimiento a facturas.",
        tableName: "invoices",
        columns: "id, invoice_number, client_name, issue_date, total, status",
        numberField: "invoice_number",
        dateField: "issue_date",
        actionHref: "/bbs-control/facturas/nueva",
        actionLabel: "Nueva factura",
        features: [
          "Crear factura desde cero o desde una cotización aprobada.",
          "Registrar estado: borrador, enviada, pagada, parcial, atrasada o anulada.",
          "Preparado para PDF, impresión y envío por correo.",
          "Base lista para pagos y notas de crédito.",
        ],
      }}
    />
  );
}



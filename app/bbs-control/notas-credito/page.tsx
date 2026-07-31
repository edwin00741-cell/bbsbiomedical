import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function CreditNotesPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Notas de crédito",
        title: "Notas de crédito",
        description: "Módulo para ajustes comerciales vinculados a facturas.",
        tableName: "credit_notes",
        columns: "id, credit_note_number, client_name, issue_date, total, status",
        numberField: "credit_note_number",
        dateField: "issue_date",
        features: [
          "Vincular nota de crédito a una factura.",
          "Registrar motivo y monto.",
          "Mantener historial comercial del cliente.",
        ],
      }}
    />
  );
}



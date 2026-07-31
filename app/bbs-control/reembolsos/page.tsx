import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function RefundsPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Reembolsos",
        title: "Reembolsos",
        description: "Control de devoluciones vinculadas a pagos registrados.",
        tableName: "refunds",
        columns: "id, amount, status, reason, refunded_at, created_at",
        numberField: "reason",
        nameField: "status",
        dateField: "created_at",
        amountField: "amount",
        features: [
          "Vincular reembolso a un pago.",
          "Registrar razón, fecha y estado.",
          "Mantener trazabilidad financiera.",
        ],
      }}
    />
  );
}



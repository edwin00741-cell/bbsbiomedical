import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function PaymentsPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Pagos",
        title: "Pagos recibidos",
        description: "Registro de pagos aplicados a facturas y clientes.",
        tableName: "payments",
        columns: "id, reference, amount, status, paid_at",
        numberField: "reference",
        nameField: "status",
        dateField: "paid_at",
        amountField: "amount",
        features: [
          "Aplicar pago a factura.",
          "Registrar método y referencia.",
          "Preparado para conciliación e historial.",
        ],
      }}
    />
  );
}



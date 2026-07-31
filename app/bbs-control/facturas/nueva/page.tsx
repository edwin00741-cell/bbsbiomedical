import { BriskModulePage } from "../../module-page";

export const dynamic = "force-dynamic";

export default function NewInvoicePage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Nueva factura",
        title: "Crear factura",
        description: "Formulario preparado para conectar factura desde cliente, cotización o artículos del catálogo.",
        features: [
          "Seleccionar cliente registrado.",
          "Cargar artículos del catálogo.",
          "Calcular subtotal, impuestos opcionales y total.",
          "Guardar como borrador o marcar como enviada.",
        ],
        emptyText: "El formulario completo se conecta en la siguiente fase operativa.",
      }}
    />
  );
}



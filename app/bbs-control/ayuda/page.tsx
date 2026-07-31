import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Ayuda",
        title: "Centro de ayuda interno",
        description: "Guías operativas para el equipo que use el panel privado.",
        features: [
          "Cómo crear clientes.",
          "Cómo crear y enviar cotizaciones.",
          "Cómo convertir cotizaciones en facturas.",
          "Cómo registrar pagos y reembolsos.",
        ],
      }}
    />
  );
}



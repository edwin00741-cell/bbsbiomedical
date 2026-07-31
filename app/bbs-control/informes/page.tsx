import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Informes",
        title: "Informes comerciales",
        description: "Vista preparada para ingresos, cotizaciones, facturas pendientes y actividad mensual.",
        features: [
          "Ingresos por mes.",
          "Cotizaciones enviadas y aprobadas.",
          "Facturas pendientes y vencidas.",
          "Clientes con mayor actividad.",
        ],
      }}
    />
  );
}



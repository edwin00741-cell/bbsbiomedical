import { BriskModulePage } from "../module-page";

export const dynamic = "force-dynamic";

export default function ToolsPage() {
  return (
    <BriskModulePage
      config={{
        eyebrow: "Herramientas",
        title: "Herramientas",
        description: "Utilidades internas para operaciones comerciales y soporte administrativo.",
        features: [
          "Duplicar documentos comerciales.",
          "Exportar datos a CSV.",
          "Importar clientes o artículos.",
          "Revisar eventos del sistema.",
        ],
      }}
    />
  );
}



import { SimplePage } from "../simple-page";

export default function MetrologyPage() {
  return (
    <SimplePage
      eyebrow="Calibracion y trazabilidad"
      title="Metrologia Biomedica"
      description="Servicios de verificacion, calibracion y control metrologico para equipos medicos criticos, con documentacion clara y trazabilidad tecnica."
      sections={[
        {
          title: "Alcance del servicio",
          body: "Realizamos evaluaciones periodicas para confirmar que los equipos de medicion mantengan parametros confiables en entornos clinicos y de laboratorio.",
        },
        {
          title: "Documentacion",
          body: "Cada intervencion puede incluir reportes, registros de calibracion y recomendaciones tecnicas para auditorias internas o procesos regulatorios.",
        },
        {
          title: "Placeholder de imagenes",
          body: "Las imagenes definitivas de laboratorio, instrumentos y equipos seran reemplazadas cuando se cierre el banco visual del proyecto.",
        },
      ]}
    />
  );
}

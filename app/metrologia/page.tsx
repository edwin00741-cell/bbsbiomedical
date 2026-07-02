import { SimplePage } from "../simple-page";

export default function MetrologyPage() {
  return (
    <SimplePage
      eyebrow="Calibracion y trazabilidad"
      title="Metrología Biomédica"
      description="Servicios de verificación, calibración y control metrológico para equipos médicos críticos, con documentación clara y trazabilidad técnica."
      image="/services/microscope-lab-ciencias.png"
      imageAlt="Microscopio en proceso de calibración metrológica"
      sections={[
        {
          title: "Alcance del servicio",
          body: "Realizamos evaluaciones periodicas para confirmar que los equipos de medicion mantengan parametros confiables en entornos clinicos y de laboratorio.",
        },
        {
          title: "Documentacion",
          body: "Cada intervención puede incluir reportes, registros de calibración y recomendaciones técnicas para auditorías internas o procesos regulatorios.",
        },
        {
          title: "Placeholder de imagenes",
          body: "Las imagenes definitivas de laboratorio, instrumentos y equipos seran reemplazadas cuando se cierre el banco visual del proyecto.",
        },
      ]}
    />
  );
}

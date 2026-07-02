import { SimplePage } from "../simple-page";

export default function MetrologyPage() {
  return (
    <SimplePage
      eyebrow="Calibración y trazabilidad"
      title="Metrología Biomédica"
      description="Servicios de verificación, calibración y control metrológico para equipos médicos críticos, con documentación clara y trazabilidad técnica."
      image="/services/microscope-lab-ciencias.png"
      imageAlt="Microscopio en proceso de calibración metrológica"
      sections={[
        {
          title: "Alcance del servicio",
          body: "Realizamos evaluaciones periódicas para confirmar que los equipos de medición mantengan parámetros confiables en entornos clínicos y de laboratorio.",
        },
        {
          title: "Documentación",
          body: "Cada intervención puede incluir reportes, registros de calibración y recomendaciones técnicas para auditorías internas o procesos regulatorios.",
        },
        {
          title: "Placeholder de imágenes",
          body: "Las imágenes definitivas de laboratorio, instrumentos y equipos serán reemplazadas cuando se cierre el banco visual del proyecto.",
        },
      ]}
    />
  );
}

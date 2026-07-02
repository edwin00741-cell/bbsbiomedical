import { SimplePage } from "../simple-page";

export default function RegulatoryPage() {
  return (
    <SimplePage
      eyebrow="Cumplimiento técnico"
      title="Gestión Regulatoria"
      description="Acompañamiento para procesos documentales, licencias, requisitos técnicos y cumplimiento aplicable a servicios y equipos biomédicos."
      image="/images/bbs-biomedical-solutions-lab.png"
      imageAlt="Laboratorio biomédico con documentación técnica"
      sections={[
        {
          title: "Diagnóstico documental",
          body: "Revisamos el estado de expedientes, registros, evidencias técnicas y requisitos necesarios para ordenar el proceso de cumplimiento.",
        },
        {
          title: "Acompañamiento",
          body: "Apoyamos a instituciones de salud en la preparación de documentos, cronogramas de regularización y seguimiento de observaciones.",
        },
        {
          title: "Contenido genérico",
          body: "Este texto funciona como base inicial y debe ajustarse cuando el equipo defina el alcance regulatorio final de BBS.",
        },
      ]}
    />
  );
}

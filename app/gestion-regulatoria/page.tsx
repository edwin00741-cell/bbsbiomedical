import { SimplePage } from "../simple-page";

export default function RegulatoryPage() {
  return (
    <SimplePage
      eyebrow="Cumplimiento tecnico"
      title="Gestion Regulatoria"
      description="Acompanamiento para procesos documentales, licencias, requisitos tecnicos y cumplimiento aplicable a servicios y equipos biomedicos."
      sections={[
        {
          title: "Diagnostico documental",
          body: "Revisamos el estado de expedientes, registros, evidencias tecnicas y requisitos necesarios para ordenar el proceso de cumplimiento.",
        },
        {
          title: "Acompanamiento",
          body: "Apoyamos a instituciones de salud en la preparacion de documentos, cronogramas de regularizacion y seguimiento de observaciones.",
        },
        {
          title: "Contenido generico",
          body: "Este texto funciona como base inicial y debe ajustarse cuando el equipo defina el alcance regulatorio final de BBS.",
        },
      ]}
    />
  );
}

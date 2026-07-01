import { SimplePage } from "../simple-page";

export default function SupportPage() {
  return (
    <SimplePage
      eyebrow="Atencion operativa"
      title="Soporte Tecnico"
      description="Canal de soporte para solicitudes, revisiones iniciales, coordinacion de visitas y seguimiento de casos tecnicos."
      sections={[
        {
          title: "Solicitudes",
          body: "El equipo puede recibir informacion del equipo, marca, modelo, falla reportada y urgencia para priorizar la respuesta.",
        },
        {
          title: "Seguimiento",
          body: "Cada caso puede documentarse con observaciones tecnicas, evidencia fotografica, recomendaciones y estado de avance.",
        },
        {
          title: "Atencion",
          body: "Mientras se definen los canales finales, el formulario de contacto funcionara como punto principal para nuevas solicitudes.",
        },
      ]}
    />
  );
}

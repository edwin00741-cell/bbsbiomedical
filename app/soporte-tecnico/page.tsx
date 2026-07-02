import { SimplePage } from "../simple-page";

export default function SupportPage() {
  return (
    <SimplePage
      eyebrow="Atencion operativa"
      title="Soporte Técnico"
      description="Canal de soporte para solicitudes, revisiones iniciales, coordinación de visitas y seguimiento de casos técnicos."
      image="/services/microscope-olympus-private.png"
      imageAlt="Técnico revisando equipo biomédico"
      sections={[
        {
          title: "Solicitudes",
          body: "El equipo puede recibir informacion del equipo, marca, modelo, falla reportada y urgencia para priorizar la respuesta.",
        },
        {
          title: "Seguimiento",
          body: "Cada caso puede documentarse con observaciones técnicas, evidencia fotográfica, recomendaciones y estado de avance.",
        },
        {
          title: "Atencion",
          body: "Mientras se definen los canales finales, el formulario de contacto funcionara como punto principal para nuevas solicitudes.",
        },
      ]}
    />
  );
}

import { SimplePage } from "../simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Politica legal"
      title="Politica de Privacidad"
      description="Texto base sobre tratamiento de datos para el sitio web de Biomedical Business and Services. Debe ser revisado por asesoría legal antes de publicación final."
      sections={[
        {
          title: "Datos recopilados",
          body: "Podemos recibir nombre, correo, telefono, empresa y detalles de la solicitud enviada voluntariamente por formularios de contacto.",
        },
        {
          title: "Uso de la información",
          body: "La información se utiliza para responder solicitudes, coordinar servicios, mejorar procesos internos y mantener comunicación comercial razonable.",
        },
        {
          title: "Analitica",
          body: "El sitio puede usar herramientas de medición como Google Analytics para entender rendimiento, trafico y comportamiento agregado de navegacion.",
        },
      ]}
      ctaTitle="Solicita información sobre privacidad"
      ctaDescription="Si necesitas aclarar el tratamiento de datos, contacta al equipo de BBS mediante el formulario."
    />
  );
}

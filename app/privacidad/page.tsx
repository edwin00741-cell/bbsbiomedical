import { SimplePage } from "../simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Politica legal"
      title="Politica de Privacidad"
      description="Texto base sobre tratamiento de datos para el sitio web de BBS Biomedical. Debe ser revisado por asesoria legal antes de publicacion final."
      sections={[
        {
          title: "Datos recopilados",
          body: "Podemos recibir nombre, correo, telefono, empresa y detalles de la solicitud enviada voluntariamente por formularios de contacto.",
        },
        {
          title: "Uso de la informacion",
          body: "La informacion se utiliza para responder solicitudes, coordinar servicios, mejorar procesos internos y mantener comunicacion comercial razonable.",
        },
        {
          title: "Analitica",
          body: "El sitio puede usar herramientas de medicion como Google Analytics para entender rendimiento, trafico y comportamiento agregado de navegacion.",
        },
      ]}
      ctaTitle="Solicita informacion sobre privacidad"
      ctaDescription="Si necesitas aclarar el tratamiento de datos, contacta al equipo de BBS mediante el formulario."
    />
  );
}

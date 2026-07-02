import { SimplePage } from "../simple-page";

export default function CookiesPage() {
  return (
    <SimplePage
      eyebrow="Preferencias digitales"
      title="Politica de Cookies"
      description="Texto base sobre uso de cookies y tecnologias similares para medición, seguridad y mejora del sitio web."
      sections={[
        {
          title: "Cookies necesarias",
          body: "Algunas cookies o tecnologias equivalentes pueden ser necesarias para que el sitio funcione correctamente y mantenga seguridad basica.",
        },
        {
          title: "Cookies de analitica",
          body: "Podemos usar herramientas de analitica para entender visitas, paginas consultadas, rendimiento y efectividad de contenidos.",
        },
        {
          title: "Gestion",
          body: "El usuario puede gestionar cookies desde la configuracion de su navegador. En una fase posterior se podra agregar un banner de consentimiento.",
        },
      ]}
    />
  );
}

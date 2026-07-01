import { SimplePage } from "../simple-page";

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Condiciones de uso"
      title="Terminos y Condiciones"
      description="Texto generico de terminos para uso del sitio web. Debe ajustarse a la operacion real y validarse legalmente antes del lanzamiento final."
      sections={[
        {
          title: "Uso del sitio",
          body: "El contenido publicado tiene fines informativos y no constituye una propuesta contractual definitiva hasta que exista una cotizacion o acuerdo formal.",
        },
        {
          title: "Servicios",
          body: "Los servicios descritos pueden variar segun disponibilidad, ubicacion, alcance tecnico, evaluacion inicial y condiciones especificas de cada equipo.",
        },
        {
          title: "Responsabilidad",
          body: "BBS procurara mantener informacion clara y actualizada, pero el usuario debe solicitar confirmacion directa para decisiones operativas o comerciales.",
        },
      ]}
    />
  );
}

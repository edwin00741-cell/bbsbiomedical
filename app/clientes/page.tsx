import { SimplePage } from "../simple-page";

export default function ClientsPage() {
  return (
    <SimplePage
      eyebrow="Relaciones institucionales"
      title="Clientes"
      description="Trabajamos con centros de salud, laboratorios, clinicas, instituciones diagnosticas y operaciones que dependen de equipos confiables."
      sections={[
        {
          title: "Segmentos",
          body: "BBS puede atender instituciones hospitalarias, clinicas privadas, laboratorios, centros odontologicos y unidades moviles de atencion.",
        },
        {
          title: "Casos destacados",
          body: "Los casos reales se incorporaran luego con fotografias, metricas y autorizacion de cada cliente.",
        },
        {
          title: "Confidencialidad",
          body: "La informacion operativa de clientes se maneja con discrecion y enfoque profesional.",
        },
      ]}
    />
  );
}

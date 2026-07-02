import { SimplePage } from "../simple-page";

export default function MedicalPortalPage() {
  return (
    <SimplePage
      eyebrow="Portal en preparacion"
      title="Portal Medico"
      description="Espacio proyectado para centralizar solicitudes, documentacion tecnica, reportes y seguimiento de servicios para clientes institucionales."
      image="/images/bbs-monitor-operating-room.png"
      imageAlt="Monitor biomedico en quirofano"
      sections={[
        {
          title: "Acceso futuro",
          body: "El portal podra incluir perfiles de clientes, historial de equipos, reportes descargables y trazabilidad de casos.",
        },
        {
          title: "Estado actual",
          body: "Por ahora esta pagina funciona como placeholder informativo mientras se define la arquitectura del portal.",
        },
        {
          title: "Siguiente fase",
          body: "Cuando se cierre el flujo operativo, se podran conectar login, roles y paneles de seguimiento.",
        },
      ]}
    />
  );
}

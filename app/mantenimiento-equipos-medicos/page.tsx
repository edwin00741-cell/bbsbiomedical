import { buildSeoMetadata, SeoLandingPage } from "../seo-landing-page";
import { seoPagesEs } from "../seo-pages";

const page = seoPagesEs["mantenimiento-equipos-medicos"];

export const metadata = buildSeoMetadata(page, "es");

export default function MedicalEquipmentMaintenancePage() {
  return <SeoLandingPage page={page} />;
}

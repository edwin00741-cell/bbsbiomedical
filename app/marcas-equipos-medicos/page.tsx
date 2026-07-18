import { buildSeoMetadata, SeoLandingPage } from "../seo-landing-page";
import { seoPagesEs } from "../seo-pages";

const page = seoPagesEs["marcas-equipos-medicos"];

export const metadata = buildSeoMetadata(page, "es");

export default function MedicalEquipmentBrandsPage() {
  return <SeoLandingPage page={page} />;
}

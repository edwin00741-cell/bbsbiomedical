import { buildSeoMetadata, SeoLandingPage } from "../../seo-landing-page";
import { seoPagesEn } from "../../seo-pages";

const page = seoPagesEn["medical-equipment-maintenance"];

export const metadata = buildSeoMetadata(page, "en");

export default function EnglishMedicalEquipmentMaintenancePage() {
  return <SeoLandingPage locale="en" page={page} />;
}

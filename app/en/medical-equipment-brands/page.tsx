import { buildSeoMetadata, SeoLandingPage } from "../../seo-landing-page";
import { seoPagesEn } from "../../seo-pages";

const page = seoPagesEn["medical-equipment-brands"];

export const metadata = buildSeoMetadata(page, "en");

export default function EnglishMedicalEquipmentBrandsPage() {
  return <SeoLandingPage locale="en" page={page} />;
}

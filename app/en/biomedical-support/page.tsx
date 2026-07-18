import { buildSeoMetadata, SeoLandingPage } from "../../seo-landing-page";
import { seoPagesEn } from "../../seo-pages";

const page = seoPagesEn["biomedical-support"];

export const metadata = buildSeoMetadata(page, "en");

export default function EnglishBiomedicalSupportPage() {
  return <SeoLandingPage locale="en" page={page} />;
}

import { buildSeoMetadata, SeoLandingPage } from "../seo-landing-page";
import { seoPagesEs } from "../seo-pages";

const page = seoPagesEs["soporte-biomedico"];

export const metadata = buildSeoMetadata(page, "es");

export default function BiomedicalSupportPage() {
  return <SeoLandingPage page={page} />;
}

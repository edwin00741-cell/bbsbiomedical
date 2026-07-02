import { notFound } from "next/navigation";
import { SimplePage } from "../../simple-page";
import { englishPages } from "../content";

type PageKey = keyof typeof englishPages;

export function generateStaticParams() {
  return Object.keys(englishPages).map((slug) => ({ slug }));
}

export default async function EnglishSimplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = englishPages[slug as PageKey];

  if (!page) {
    notFound();
  }

  return (
    <SimplePage
      ctaDescription="Share the equipment, institution and urgency so our team can coordinate the next step."
      ctaTitle="Request a technical evaluation"
      description={page.description}
      eyebrow={page.eyebrow}
      image={page.image}
      imageAlt={page.imageAlt || page.title}
      locale="en"
      overviewTitle="General information"
      sections={page.sections}
      sideLabel="Biomedical Business and Services"
      title={page.title}
    />
  );
}

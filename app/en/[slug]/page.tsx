import Image from "next/image";
import { notFound } from "next/navigation";
import { CTA, Footer, Header, Hero, SectionHeading } from "../../components";
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
    <main>
      <Header locale="en" />
      <Hero
        compact
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        primary="Request service"
        secondary="View services"
        primaryHref="#contact"
        secondaryHref="/en#services"
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="sticky top-28 hidden rounded-[8px] border border-slate-200 bg-slate-50 p-8 lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-slate-200">
              {page.image ? (
                <Image
                  alt={page.title}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src={page.image}
                />
              ) : (
                <Image
                  alt="BBS Biomedical Business and Services"
                  className="object-contain p-10"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src="/brand/bbs-primary-horizontal-color.png"
                />
              )}
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              BBS
            </p>
          </div>
          <div>
            <SectionHeading title="Overview" description={page.description} />
            <div className="mt-10 grid gap-5">
              {page.sections.map((section) => (
                <article
                  className="rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm"
                  key={section.title}
                >
                  <h2 className="text-2xl font-black text-slate-950">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <CTA
        locale="en"
        title="Request a technical evaluation"
        description="Share the equipment, institution and urgency so our team can coordinate the next step."
      />
      <Footer locale="en" />
    </main>
  );
}

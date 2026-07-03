import Image from "next/image";
import { CTA, Footer, Header, Hero, SectionHeading } from "./components";

type InfoSection = {
  title: string;
  body: string;
};

type SimplePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
  image?: string;
  imageAlt?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  locale?: "es" | "en";
  overviewTitle?: string;
  sideLabel?: string;
};

export function SimplePage({
  eyebrow,
  title,
  description,
  sections,
  image,
  imageAlt = title,
  ctaTitle = "Conversemos sobre la solución que necesita.",
  ctaDescription = "Complete el formulario y nuestro equipo coordinará una respuesta clara para su institución.",
  locale = "es",
  overviewTitle = locale === "en" ? "General information" : "Información general",
  sideLabel = "Biomedical Business and Service",
}: SimplePageProps) {
  const isEnglish = locale === "en";
  return (
    <main>
      <Header locale={locale} />
      <Hero
        compact
        eyebrow={eyebrow}
        title={title}
        description={description}
        primary={isEnglish ? "Request information" : "Solicitar información"}
        secondary={isEnglish ? "View services" : "Ver servicios"}
        primaryHref={isEnglish ? "#contact" : "#contacto"}
        secondaryHref={isEnglish ? "/en#services" : "/#servicios"}
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          <aside className="hidden h-full rounded-[8px] border border-slate-200 bg-slate-50 p-8 lg:flex lg:flex-col">
            <div className="relative min-h-[520px] flex-1 overflow-hidden rounded-[8px] bg-slate-200">
              {image ? (
                <Image
                  alt={imageAlt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src={image}
                />
              ) : (
                <Image
                  alt="Biomedical Business and Service"
                  className="object-contain p-12"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src="/brand/bbs-primary-horizontal-color.png"
                />
              )}
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              {sideLabel}
            </p>
          </aside>
          <div>
            <SectionHeading title={overviewTitle} description={description} />
            <div className="mt-10 grid gap-5">
              {sections.map((section) => (
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
      <CTA title={ctaTitle} description={ctaDescription} locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}

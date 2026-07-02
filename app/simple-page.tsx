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
};

export function SimplePage({
  eyebrow,
  title,
  description,
  sections,
  image,
  imageAlt = title,
  ctaTitle = "Conversemos sobre la solucion que necesita.",
  ctaDescription = "Complete el formulario y nuestro equipo coordinara una respuesta clara para su institucion.",
}: SimplePageProps) {
  return (
    <main>
      <Header />
      <Hero
        compact
        eyebrow={eyebrow}
        title={title}
        description={description}
        primary="Solicitar informacion"
        secondary="Ver servicios"
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="sticky top-28 hidden rounded-[8px] border border-slate-200 bg-slate-50 p-8 lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-slate-200">
              {image ? (
                <Image
                  alt={imageAlt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  src={image}
                />
              ) : null}
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              BBS Biomedical
            </p>
          </div>
          <div>
            <SectionHeading title="Informacion general" description={description} />
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
      <CTA title={ctaTitle} description={ctaDescription} />
      <Footer />
    </main>
  );
}

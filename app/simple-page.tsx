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
  ctaTitle?: string;
  ctaDescription?: string;
};

export function SimplePage({
  eyebrow,
  title,
  description,
  sections,
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
            <div className="aspect-[4/3] rounded-[8px] bg-[linear-gradient(135deg,#dbeafe,#f8fafc_48%,#67e8f9)]" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              Imagen placeholder
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

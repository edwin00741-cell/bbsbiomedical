import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { CTA, Footer, Header, Hero, SectionHeading } from "./components";
import { MotionCard, Reveal, RevealSection, Stagger, StaggerItem } from "./motion-primitives";
import type { SeoPageContent } from "./seo-pages";

type Locale = "es" | "en";

const baseUrl = "https://bbsbiomedical.com";

export function buildSeoMetadata(page: SeoPageContent, locale: Locale): Metadata {
  const path = locale === "en" ? `/en/${page.slug}` : `/${page.slug}`;
  const alternatePath = locale === "en" ? `/${page.enSlug}` : `/en/${page.enSlug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: path,
      languages: locale === "en" ? { es: alternatePath, en: path } : { es: path, en: alternatePath },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${baseUrl}${path}`,
      siteName: "Biomedical Business and Service",
      images: [
        {
          url: page.image,
          width: 1680,
          height: 945,
          alt: page.imageAlt,
        },
      ],
      locale: locale === "en" ? "en_US" : "es_PA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [page.image],
    },
  };
}

export function SeoLandingPage({ page, locale = "es" }: { page: SeoPageContent; locale?: Locale }) {
  const isEnglish = locale === "en";
  const path = isEnglish ? `/en/${page.slug}` : `/${page.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.description,
    provider: {
      "@type": "MedicalBusiness",
      name: "Biomedical Business and Service",
      url: baseUrl,
      telephone: "+50762023206",
      areaServed: ["Panamá", "Panamá Oeste", "La Chorrera", "Worldwide"],
    },
    areaServed: ["Panamá", "Panamá Oeste", "La Chorrera", "Worldwide"],
    serviceType: page.keywords,
    url: `${baseUrl}${path}`,
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main>
      <Header locale={locale} />
      <Hero
        compact
        description={page.description}
        eyebrow={page.eyebrow}
        primary={isEnglish ? "Request support" : "Solicitar soporte"}
        primaryHref={isEnglish ? "#contact" : "#contacto"}
        secondary={isEnglish ? "View technical service" : "Ver servicio técnico"}
        secondaryHref={isEnglish ? "/en/technical-service" : "/servicio-tecnico"}
        title={page.title}
      />

      <RevealSection className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <Reveal className="relative min-h-[440px] overflow-hidden rounded-[8px] bg-slate-100 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <Image
              alt={page.imageAlt}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={page.image}
            />
          </Reveal>
          <div>
            <SectionHeading
              title={isEnglish ? "Technical support built for clinical continuity" : "Soporte técnico orientado a continuidad clínica"}
              description={
                isEnglish
                  ? "BBS combines biomedical service, practical documentation and equipment-focused diagnostics for healthcare operations."
                  : "BBS combina servicio biomédico, documentación práctica y diagnóstico técnico enfocado en equipos médicos reales."
              }
            />
            <Stagger className="mt-10 grid gap-4">
              {page.cards.map(({ title, description, icon: Icon }) => (
                <StaggerItem key={title}>
                  <MotionCard className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-cyan-50 text-cyan-700">
                        <Icon size={22} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">{title}</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </MotionCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {page.sections.map((section) => (
            <MotionCard
              className="rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm"
              key={section.title}
            >
              <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">{section.body}</p>
            </MotionCard>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow={isEnglish ? "Frequent questions" : "Preguntas frecuentes"}
            title={isEnglish ? "What institutions usually ask" : "Lo que suelen preguntar las instituciones"}
          />
          <div className="mt-10 grid gap-4">
            {page.faqs.map((faq) => (
              <MotionCard className="rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm" key={faq.question}>
                <h2 className="text-xl font-black text-slate-950">{faq.question}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{faq.answer}</p>
              </MotionCard>
            ))}
          </div>
        </div>
      </RevealSection>

      <CTA
        description={
          isEnglish
            ? "Send brand, model, failure, photos and urgency level so our team can review the case."
            : "Envíe marca, modelo, falla, fotos y nivel de urgencia para que nuestro equipo revise el caso."
        }
        locale={locale}
        title={isEnglish ? "Need biomedical technical support?" : "¿Necesita soporte técnico biomédico?"}
      />
      <Footer locale={locale} />
      <Script id={`seo-service-${page.slug}`} strategy="beforeInteractive" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </main>
  );
}

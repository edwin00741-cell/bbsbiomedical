import { notFound } from "next/navigation";
import Image from "next/image";
import {
  CTA,
  CheckList,
  Footer,
  Header,
  Hero,
  IconCard,
  SectionHeading,
  VisualPanel,
} from "../../components";
import {
  alaraSteps,
  applicableSectors,
  capabilities,
  clients,
  projects,
  radiationScope,
  values,
} from "../../data";
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

  if (slug === "about") {
    return <EnglishAboutPage />;
  }

  if (slug === "technical-service") {
    return <EnglishTechnicalServicePage />;
  }

  if (slug === "radiological-protection") {
    return <EnglishRadiologicalProtectionPage />;
  }

  if (slug === "clients") {
    return <EnglishClientsPage />;
  }

  return (
    <SimplePage
      ctaDescription={
        page.ctaDescription ||
        "Complete the form and our team will coordinate a clear response for your institution."
      }
      ctaTitle={page.ctaTitle || "Let's discuss the solution you need."}
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

const translatedValues = [
  "Absolute scientific rigor",
  "Clinical ethics and transparency",
  "Continuous technological innovation",
  "Commitment to wellbeing",
];

const translatedProjects = [
  {
    title: "Preventive microscope maintenance - Hospital Del Nino Dr. Jose Renan Esquivel",
    description:
      "Comprehensive preventive maintenance for high-resolution microscopy equipment supporting continuous clinical operation.",
  },
  {
    title: "Preventive maintenance and restoration of Olympus microscope - Private client",
    description:
      "Restoration, electrical review and optical calibration for Olympus equipment.",
  },
  {
    title: "Preventive and corrective dental chair maintenance - Centro Vocacional de Chapala",
    description:
      "Preventive and corrective review of pneumatic, hydraulic and internal line systems.",
  },
  {
    title: "Preventive and corrective microscope maintenance - Science Lab, Colegio Bilingue Biancheri",
    description:
      "Technical support for educational laboratory microscopes and optical diagnostic equipment.",
  },
  {
    title: "Preventive maintenance for nitrous oxide anesthesia equipment - Clinica Dental Armonia",
    description:
      "Flow, pressure and operational safety verification for dental anesthesia equipment.",
  },
  {
    title: "Air conditioning installation and startup - Colegio Moises Castillo Ocana",
    description:
      "Installation, verification and startup of an air conditioning system.",
  },
];

const translatedCapabilities = [
  {
    title: "High-complexity workshop",
    description:
      "Equipped with traceable calibration instruments for component-level repairs.",
  },
  {
    title: "Critical spare parts stock",
    description:
      "Inventory of original parts for major market brands to minimize downtime.",
  },
  {
    title: "24/7 support",
    description:
      "Emergency technical attention in less than four hours for critical care centers.",
  },
];

const translatedRadiationScope = [
  {
    title: "Shielding verification",
    description: "On-site measurements of radiation levels in adjacent areas.",
  },
  {
    title: "ALARA protocols",
    description:
      "Training for clinical, technical and administrative teams exposed to radiation.",
  },
  {
    title: "Protection manuals",
    description:
      "Required technical documentation for safe operation under applicable standards.",
  },
  {
    title: "Equipment quality control",
    description:
      "Periodic tests for X-ray, CT, mammography and fluoroscopy equipment to support the minimum effective dose.",
  },
];

const translatedAlaraSteps = [
  {
    title: "Justification",
    description: "Each procedure must produce a net benefit greater than the risk.",
  },
  {
    title: "Optimization",
    description:
      "Use of techniques that minimize exposure without losing diagnostic precision.",
  },
  {
    title: "Limitation",
    description: "Strict respect for legal individual dose limits.",
  },
];

const translatedSectors = [
  "Hospitals",
  "Dental clinics",
  "Laboratories",
  "Industrial radiology",
  "Veterinary",
];

function EnglishAboutPage() {
  return (
    <main>
      <Header locale="en" />
      <Hero
        compact
        eyebrow="Biomedical excellence"
        title="Who we are"
        description="We lead healthcare transformation through advanced technical solutions, scientific rigor and a human vision of applied biomedical service."
        primary="Start now"
        secondary="View success cases"
        primaryHref="#contact"
        secondaryHref="/en/clients"
      />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <div className="relative min-h-[620px] overflow-hidden rounded-[8px] bg-slate-100 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <Image
              alt="Bryan Rodriguez, founder of Biomedical Business and Services"
              className="object-cover object-center"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              src="/team/bryan-rodriguez-founder.png"
            />
            <div className="absolute left-5 top-5 rounded-[8px] bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                Founder
              </p>
              <p className="text-lg font-black text-slate-950">Bryan Rodriguez</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
              Visionary leadership
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Bryan Rodriguez
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Founder and Executive Director of Biomedical Business and Services.
              With a path shaped by clinical innovation and commitment to
              diagnostic precision, Bryan has positioned BBS as a reference for
              integrated healthcare technical support.
            </p>
            <blockquote className="mt-8 border-l-4 border-cyan-500 pl-6 text-xl font-bold leading-8 text-slate-800">
              "Our mission is not only to implement technology; it is to ensure
              every diagnosis becomes the foundation for a sound life decision.
              Precision is our native language."
            </blockquote>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Our Identity"
            description="The pillars that support every process, development and technical diagnosis performed by our team."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <article className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">Mission</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Provide advanced biomedical solutions that raise the standard of
                clinical precision through high-reliability technical support.
              </p>
            </article>
            <article className="rounded-[8px] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-black">Vision</h3>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Become the most trusted technology partner in the biomedical
                sector, supporting the future of preventive medicine.
              </p>
            </article>
            <article className="rounded-[8px] bg-slate-950 p-8 text-white shadow-sm">
              <h3 className="text-3xl font-black">Our Values</h3>
              <div className="mt-7">
                <CheckList items={translatedValues} tone="dark" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <CTA
        locale="en"
        title="Ready to transform your clinical practice?"
        description="Join the healthcare centers already strengthening diagnostic reliability with BBS."
      />
      <Footer locale="en" />
    </main>
  );
}

function EnglishTechnicalServicePage() {
  return (
    <main>
      <Header locale="en" />
      <Hero
        eyebrow="Precision clinical engineering"
        title="Excellence in Biomedical Technical Service."
        description="Preventive maintenance, corrective service and certified calibration for healthcare institutions that cannot afford downtime. Technical rigor applied to medical innovation."
        primary="View completed work"
        secondary="Request pricing"
        primaryHref="#services"
        secondaryHref="#contact"
      />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading title="Maintenance with documented rigor." />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              We do more than repair equipment; we protect operational
              continuity for diagnostic centers and high-complexity laboratories.
              Our protocol follows quality standards so each intervention is
              documented with precision.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[8px] bg-slate-950 p-7 text-white">
                <p className="text-5xl font-black">500+</p>
                <p className="mt-2 text-sm font-black uppercase text-cyan-300">
                  Annual interventions
                </p>
              </div>
              <div className="rounded-[8px] bg-cyan-50 p-7 text-slate-950">
                <p className="text-5xl font-black">99.8%</p>
                <p className="mt-2 text-sm font-black uppercase text-cyan-700">
                  Guaranteed uptime
                </p>
              </div>
            </div>
          </div>
          <VisualPanel
            label="Service lab"
            title="Diagnostics, calibration and support with complete traceability."
          />
        </div>
      </section>

      <section className="px-6 py-24" id="services">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Technical portfolio"
            title="Completed Work"
            description="A sample of our technical capability in hospital and laboratory environments."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {projects.map((project, index) => (
              <article
                className={`overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
                key={project.title}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image
                    alt={translatedProjects[index]?.title || project.title}
                    className="object-cover"
                    fill
                    sizes={
                      index === 0
                        ? "(min-width: 1024px) 62vw, 100vw"
                        : "(min-width: 1024px) 31vw, 100vw"
                    }
                    src={project.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_45%,rgba(2,6,23,0.68)_100%)]" />
                  <p className="absolute bottom-5 left-5 right-5 text-sm font-black uppercase tracking-[0.14em] text-white/88">
                    {project.tag || "BBS technical"}
                  </p>
                </div>
                <div className="p-7">
                  <h3 className="text-2xl font-black text-slate-950">
                    {translatedProjects[index]?.title || project.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {translatedProjects[index]?.description || project.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr]">
          <SectionHeading title="Our Response Capability" />
          <div className="grid gap-5">
            {capabilities.map((capability, index) => (
              <IconCard
                key={capability.title}
                description={
                  translatedCapabilities[index]?.description || capability.description
                }
                icon={capability.icon}
                title={translatedCapabilities[index]?.title || capability.title}
              />
            ))}
          </div>
        </div>
      </section>

      <CTA
        locale="en"
        title="Does your equipment need specialized technical attention?"
        description="Schedule a technical visit or request a quote for preventive maintenance contracts."
      />
      <Footer locale="en" />
    </main>
  );
}

function EnglishRadiologicalProtectionPage() {
  return (
    <main>
      <Header locale="en" />
      <Hero
        eyebrow="Radiological safety"
        title="Clinical Rigor in Radiological Protection"
        description="We optimize facility safety through advanced protocols that protect patients and technical teams under international standards."
        primary="Review technical scope"
        secondary="View standards"
        primaryHref="#services"
        secondaryHref="#alara"
      />

      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading title="Class C Responsible Officer Service" />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              We have certified professionals who can act as Class C Radiation
              Protection Responsible Officers, supervising compliance and
              operational safety in facilities using radioactive sources or
              ionizing radiation generating equipment.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "License management",
                "Dosimetry monitoring",
                "Risk evaluation",
                "Technical audit",
              ].map((item) => (
                <div
                  className="rounded-[8px] border border-slate-200 p-5 font-black text-slate-800"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <VisualPanel
            label="ALARA"
            title="Control, measurement and technical documentation for radiological environments."
            tone="dark"
          />
        </div>
      </section>

      <section className="px-6 py-24" id="services">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Technical Service Scope"
            description="Comprehensive coverage designed for high-complexity hospital and clinical infrastructure."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {radiationScope.map((item, index) => (
              <IconCard
                key={item.title}
                description={
                  translatedRadiationScope[index]?.description || item.description
                }
                icon={item.icon}
                title={translatedRadiationScope[index]?.title || item.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white" id="alara">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
              Control and management
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Management Philosophy: The ALARA Principle
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              "As Low As Reasonably Achievable." We apply scientific rigor to
              keep radiation doses as low as reasonably possible, balancing
              diagnostic quality with maximum safety.
            </p>
          </div>
          <div className="grid gap-4">
            {alaraSteps.map((step, index) => (
              <article
                className="rounded-[8px] border border-white/10 bg-white/8 p-6"
                key={step.title}
              >
                <p className="text-sm font-black text-cyan-300">0{index + 1}</p>
                <h3 className="mt-2 text-2xl font-black">
                  {translatedAlaraSteps[index]?.title || step.title}
                </h3>
                <p className="mt-3 text-slate-300">
                  {translatedAlaraSteps[index]?.description || step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Applicable sectors
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {translatedSectors.map((sector) => (
              <span
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                key={sector}
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CTA
        locale="en"
        title="Do you need to validate radiological safety at your facility?"
        description="Request a technical evaluation and receive a clear compliance path."
      />
      <Footer locale="en" />
    </main>
  );
}

function EnglishClientsPage() {
  return (
    <main>
      <Header locale="en" />
      <Hero
        compact
        eyebrow="Institutional relationships"
        title="Clients"
        description="We work with public institutions, healthcare centers, clinics, laboratories and organizations that depend on reliable equipment."
        primary="Request information"
        secondary="View services"
        primaryHref="#contact"
        secondaryHref="/en#services"
      />

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Institutions that have trusted BBS"
            description="Logos of clients and allies served by our team. Case stories and project images can be incorporated in a later phase."
          />
          <div className="mt-12 grid items-center gap-x-14 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <article
                className="flex min-h-[120px] items-center justify-center text-center"
                key={client.name}
              >
                <Image
                  alt={client.name}
                  className="max-h-24 w-auto max-w-full object-contain opacity-85 grayscale transition hover:opacity-100 hover:grayscale-0"
                  height={140}
                  src={client.logo}
                  width={280}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTA
        locale="en"
        title="Does your institution need technical support?"
        description="Tell us about the current condition of your equipment and the support you need."
      />
      <Footer locale="en" />
    </main>
  );
}

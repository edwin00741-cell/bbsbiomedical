import Link from "next/link";
import Image from "next/image";
import { Activity, ClipboardCheck, Radiation, Wrench } from "lucide-react";
import {
  CTA,
  CheckList,
  Footer,
  Header,
  HomeHero,
  HeroSupportImage,
  RepairProcessSection,
  SectionHeading,
} from "../components";
import { clients } from "../data";
import { MotionCard, Reveal, RevealSection, Stagger, StaggerItem } from "../motion-primitives";
import { englishServices } from "./content";

const icons = [Wrench, Activity, Radiation, ClipboardCheck];

export default function EnglishHome() {
  return (
    <main>
      <Header locale="en" />
      <HomeHero locale="en" />
      <HeroSupportImage />
      <RepairProcessSection locale="en" />

      <RevealSection className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.92fr_1fr] lg:items-center">
          <Reveal className="relative min-h-[420px] overflow-hidden rounded-[8px] bg-slate-200 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <Image
              alt="Biomedical laboratory with clinical equipment"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              src="/images/bbs-biomedical-solutions-lab.png"
            />
            <div className="absolute left-6 top-6 rounded-[8px] bg-white/88 px-4 py-3 shadow-lg backdrop-blur">
              <Image
                alt="Biomedical Business and Service"
                className="h-auto w-[150px]"
                height={838}
                src="/brand/bbs-primary-horizontal-color.png"
                width={3270}
              />
            </div>
          </Reveal>

          <Reveal>
            <SectionHeading title="Precision biomedical service for clinical continuity." />
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Biomedical Business and Service helps healthcare organizations
              protect the performance, safety and reliability of their medical
              equipment.
            </p>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Our team combines technical discipline, documentation and service
              responsiveness so each asset can continue supporting patient care.
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  "Strict regulatory compliance",
                  "Priority response times",
                  "Certified measurement technology",
                ]}
              />
            </div>
          </Reveal>
        </div>
      </RevealSection>

      <RevealSection className="px-6 py-24" id="services">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Services"
            description="Modular technical services for clinics, hospitals, laboratories and diagnostic centers."
          />
          <Stagger className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {englishServices.map((service, index) => {
              const Icon = icons[index];
              return (
                <StaggerItem key={service.title}>
                  <Link href={service.href}>
                    <MotionCard className="h-full rounded-[8px] border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-cyan-50 text-cyan-700">
                        <Icon size={24} strokeWidth={2.2} />
                      </div>
                      <h2 className="mt-7 text-2xl font-black text-slate-950">
                        {service.title}
                      </h2>
                      <p className="mt-4 text-base leading-7 text-slate-600">
                        {service.description}
                      </p>
                    </MotionCard>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </RevealSection>

      <RevealSection className="border-y border-slate-200 bg-white px-6 py-20" id="clients">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Trusted by healthcare and institutional teams
          </p>
          <Stagger className="mt-10 grid items-center gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <StaggerItem
                className="flex min-h-[104px] items-center justify-center px-2"
                key={client.name}
              >
                <Image
                  alt={client.name}
                  className="max-h-20 w-auto max-w-full object-contain opacity-85 grayscale transition hover:opacity-100 hover:grayscale-0"
                  height={120}
                  src={client.logo}
                  width={240}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </RevealSection>

      <CTA
        locale="en"
        title="Ready to improve clinical equipment reliability?"
        description="Tell us what equipment or service you need reviewed and our team will coordinate the next step."
      />
      <Footer locale="en" />
    </main>
  );
}

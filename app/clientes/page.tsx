import Image from "next/image";
import { CTA, Footer, Header, Hero, SectionHeading } from "../components";
import { clients } from "../data";
import { RevealSection, Stagger, StaggerItem } from "../motion-primitives";

export default function ClientsPage() {
  return (
    <main>
      <Header />
      <Hero
        compact
        eyebrow="Relaciones institucionales"
        title="Clientes"
        description="Trabajamos con instituciones públicas, centros de salud, clínicas, laboratorios y organizaciones que dependen de equipos confiables."
        primary="Solicitar información"
        secondary="Ver servicios"
      />

      <RevealSection className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Instituciones que han confiado en BBS"
            description="Logos de clientes y aliados atendidos por nuestro equipo. Las historias de caso e imágenes de proyecto se incorporarán en una siguiente fase."
          />
          <Stagger className="mt-12 grid items-center gap-x-14 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((client) => (
              <StaggerItem
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
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </RevealSection>

      <CTA
        title="¿Tu institución necesita respaldo técnico?"
        description="Conversemos sobre el estado actual de sus equipos y el tipo de soporte que necesita."
      />
      <Footer />
    </main>
  );
}

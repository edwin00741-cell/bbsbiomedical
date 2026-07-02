type EnglishPage = {
  eyebrow: string;
  title: string;
  description: string;
  sections: { title: string; body: string }[];
  image?: string;
  imageAlt?: string;
};
export const englishServices = [
  {
    title: "Technical Service",
    description:
      "Preventive and corrective maintenance for biomedical, dental, diagnostic and clinical support equipment.",
    href: "/en/technical-service",
  },
  {
    title: "Metrology",
    description:
      "Calibration, verification and technical measurement processes for medical equipment under traceable criteria.",
    href: "/en/metrology",
  },
  {
    title: "Radiological Protection",
    description:
      "Radiation safety support, quality control and documentation for facilities that operate emitting equipment.",
    href: "/en/radiological-protection",
  },
  {
    title: "Regulatory Management",
    description:
      "Technical assistance for documentation, permits and compliance requirements related to medical equipment.",
    href: "/en/regulatory-management",
  },
];

export const englishPages: Record<string, EnglishPage> = {
  about: {
    eyebrow: "Biomedical excellence",
    title: "About Biomedical Business and Services",
    description:
      "We support healthcare institutions with precise biomedical service, technical rigor and a human understanding of clinical operations.",
    sections: [
      {
        title: "Who we are",
        body: "Biomedical Business and Services is a Panama-based technical partner for healthcare providers that need dependable biomedical equipment support, metrology, radiological protection and regulatory guidance.",
      },
      {
        title: "Leadership",
        body: "Founder Bryan Rodriguez leads the company with a focus on clinical continuity, diagnostic precision and transparent technical processes.",
      },
      {
        title: "How we work",
        body: "Every service starts with a clear technical evaluation, documented scope, practical recommendations and communication designed for clinical decision makers.",
      },
    ],
    image: "/team/bryan-rodriguez-founder.png",
  },
  "technical-service": {
    eyebrow: "Services",
    title: "Technical Service",
    description:
      "Preventive and corrective maintenance for biomedical equipment that keeps healthcare operations running.",
    sections: [
      {
        title: "Preventive maintenance",
        body: "Scheduled inspections help reduce downtime, identify wear, validate safety conditions and preserve equipment performance.",
      },
      {
        title: "Corrective service",
        body: "We diagnose faults, define repair scope and support equipment recovery with practical technical documentation.",
      },
      {
        title: "Clinical continuity",
        body: "Our work is organized around operational urgency, traceability and clear communication with each institution.",
      },
    ],
    image: "/services/microscope-olympus-private.png",
  },
  metrology: {
    eyebrow: "Services",
    title: "Metrology",
    description:
      "Calibration and verification processes that strengthen confidence in clinical measurements.",
    sections: [
      {
        title: "Measurement verification",
        body: "We review critical parameters and document measurement behavior for equipment used in clinical and diagnostic environments.",
      },
      {
        title: "Traceability mindset",
        body: "Metrology work is organized to support audit readiness, operational confidence and safer clinical decisions.",
      },
      {
        title: "Actionable reports",
        body: "Reports are written to be useful for biomedical, administrative and clinical teams.",
      },
    ],
    image: "/services/microscope-lab-ciencias.png",
  },
  "radiological-protection": {
    eyebrow: "Services",
    title: "Radiological Protection",
    description:
      "Support for radiation safety, quality control and documentation for facilities that operate radiological equipment.",
    sections: [
      {
        title: "Safety documentation",
        body: "We help organize technical documentation, operating procedures and records that support radiation safety management.",
      },
      {
        title: "Quality control",
        body: "Technical reviews can support safer operation, lower exposure risk and better compliance discipline.",
      },
      {
        title: "Institutional support",
        body: "The service is designed for clinics, hospitals, dental centers and diagnostic operations.",
      },
    ],
    image: "/services/anesthesia-nitrous-armonia.png",
  },
  "regulatory-management": {
    eyebrow: "Services",
    title: "Regulatory Management",
    description:
      "Technical guidance for permits, requirements and documentation connected to biomedical services and equipment.",
    sections: [
      {
        title: "Documentation review",
        body: "We help identify missing technical documents, organize records and align files with institutional requirements.",
      },
      {
        title: "Process support",
        body: "Our team supports clients with practical guidance during equipment-related administrative and regulatory processes.",
      },
      {
        title: "Operational clarity",
        body: "The objective is to reduce uncertainty and give healthcare teams a clearer path to compliance.",
      },
    ],
    image: "/images/bbs-biomedical-solutions-lab.png",
  },
  clients: {
    eyebrow: "Trust",
    title: "Clients and institutional experience",
    description:
      "We work with healthcare, education and institutional clients that require precise, documented and responsive technical service.",
    sections: [
      {
        title: "Institutional support",
        body: "Our experience includes hospitals, clinics, laboratories, dental centers and educational institutions.",
      },
      {
        title: "Service focus",
        body: "Each engagement is handled with attention to uptime, traceability and practical communication.",
      },
    ],
    image: "/images/bbs-monitor-operating-room.png",
  },
  "medical-portal": {
    eyebrow: "Portal",
    title: "Medical Portal",
    description:
      "A future client space for service requests, technical documentation, reports and service tracking.",
    sections: [
      {
        title: "Coming soon",
        body: "This area is planned as a centralized portal for institutional clients.",
      },
    ],
  },
  "technical-support": {
    eyebrow: "Support",
    title: "Technical Support",
    description:
      "Request support for biomedical equipment and coordinate a technical evaluation with BBS.",
    sections: [
      {
        title: "Support requests",
        body: "Use the contact form to describe the equipment, current condition, urgency and institution details.",
      },
    ],
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    description:
      "Base privacy information for website contact and communication processes.",
    sections: [
      {
        title: "Information received",
        body: "We may receive name, email, phone number, organization and details voluntarily submitted through contact forms.",
      },
      {
        title: "Use of information",
        body: "Information is used to respond to requests, coordinate service and maintain reasonable business communication.",
      },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms and Conditions",
    description:
      "General terms for browsing this website and requesting information about BBS services.",
    sections: [
      {
        title: "Service scope",
        body: "Information on this website is general and does not replace a formal technical evaluation or commercial agreement.",
      },
      {
        title: "Availability",
        body: "Services may vary depending on location, equipment condition, technical scope and scheduling.",
      },
    ],
  },
  cookies: {
    eyebrow: "Legal",
    title: "Cookie Policy",
    description:
      "This website may use analytics and performance technologies to understand visits and improve the experience.",
    sections: [
      {
        title: "Analytics",
        body: "Analytics tools can help measure traffic, page performance and user interaction in an aggregated way.",
      },
    ],
  },
};

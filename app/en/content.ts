type EnglishPage = {
  eyebrow: string;
  title: string;
  description: string;
  sections: { title: string; body: string }[];
  image?: string;
  imageAlt?: string;
  ctaTitle?: string;
  ctaDescription?: string;
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
    title: "About Biomedical Business and Service",
    description:
      "We support healthcare institutions with precise biomedical service, technical rigor and a human understanding of clinical operations.",
    sections: [
      {
        title: "Who we are",
        body: "Biomedical Business and Service is a Panama-based technical partner for healthcare providers that need dependable biomedical equipment support, metrology, radiological protection and regulatory guidance.",
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
    eyebrow: "Calibration and traceability",
    title: "Biomedical Metrology",
    description:
      "Verification, calibration and metrological control services for critical medical equipment, with clear documentation and technical traceability.",
    sections: [
      {
        title: "Service scope",
        body: "We perform periodic evaluations to confirm that measurement equipment maintains reliable parameters in clinical and laboratory environments.",
      },
      {
        title: "Documentation",
        body: "Each intervention may include reports, calibration records and technical recommendations for internal audits or regulatory processes.",
      },
      {
        title: "Image placeholder",
        body: "The final laboratory, instrument and equipment images will be replaced when the project's visual library is completed.",
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
    eyebrow: "Technical compliance",
    title: "Regulatory Management",
    description:
      "Support for documentation processes, licenses, technical requirements and compliance applicable to biomedical services and equipment.",
    sections: [
      {
        title: "Document diagnosis",
        body: "We review the status of files, records, technical evidence and required items needed to organize the compliance process.",
      },
      {
        title: "Support",
        body: "We help healthcare institutions prepare documents, regularization timelines and follow-up responses to observations.",
      },
      {
        title: "Generic content",
        body: "This text works as an initial base and should be adjusted when the team defines the final regulatory scope for BBS.",
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
    eyebrow: "Portal in preparation",
    title: "Medical Portal",
    description:
      "A future client space for service requests, technical documentation, reports and service tracking.",
    sections: [
      {
        title: "Future access",
        body: "The portal may include client profiles, equipment history, downloadable reports and case traceability.",
      },
      {
        title: "Current status",
        body: "For now this page works as an informational placeholder while the portal architecture is defined.",
      },
      {
        title: "Next phase",
        body: "Once the operational flow is finalized, login, roles and tracking dashboards can be connected.",
      },
    ],
    image: "/images/bbs-monitor-operating-room.png",
  },
  "technical-support": {
    eyebrow: "Operational attention",
    title: "Technical Support",
    description:
      "Support channel for requests, initial reviews, visit coordination and technical case follow-up.",
    sections: [
      {
        title: "Requests",
        body: "The team can receive equipment information, brand, model, reported failure and urgency to prioritize the response.",
      },
      {
        title: "Follow-up",
        body: "Each case can be documented with technical observations, photographic evidence, recommendations and progress status.",
      },
      {
        title: "Attention",
        body: "While the final channels are defined, the contact form will work as the main point for new requests.",
      },
    ],
    image: "/services/microscope-olympus-private.png",
  },
  privacy: {
    eyebrow: "Legal policy",
    title: "Privacy Policy",
    description:
      "Base text about data handling for the Biomedical Business and Service website. It should be reviewed by legal counsel before final publication.",
    sections: [
      {
        title: "Collected data",
        body: "We may receive name, email, phone number, organization and details voluntarily submitted through contact forms.",
      },
      {
        title: "Use of information",
        body: "Information is used to respond to requests, coordinate services, improve internal processes and maintain reasonable business communication.",
      },
      {
        title: "Analytics",
        body: "The site may use measurement tools such as Google Analytics to understand performance, traffic and aggregated navigation behavior.",
      },
    ],
    ctaTitle: "Request privacy information",
    ctaDescription:
      "If you need clarification about data handling, contact the BBS team through the form.",
  },
  terms: {
    eyebrow: "Terms of use",
    title: "Terms and Conditions",
    description:
      "Generic terms text for website use. It should be adjusted to the real operation and legally validated before final launch.",
    sections: [
      {
        title: "Website use",
        body: "Published content is informational and does not constitute a final contractual proposal until a formal quotation or agreement exists.",
      },
      {
        title: "Services",
        body: "The described services may vary according to availability, location, technical scope, initial evaluation and the specific conditions of each piece of equipment.",
      },
      {
        title: "Responsibility",
        body: "BBS will seek to keep information clear and updated, but users should request direct confirmation before making operational or commercial decisions.",
      },
    ],
  },
  cookies: {
    eyebrow: "Digital preferences",
    title: "Cookie Policy",
    description:
      "Base text about the use of cookies and similar technologies for measurement, security and website improvement.",
    sections: [
      {
        title: "Necessary cookies",
        body: "Some cookies or equivalent technologies may be necessary for the site to work correctly and maintain basic security.",
      },
      {
        title: "Analytics",
        body: "We may use analytics tools to understand visits, viewed pages, performance and content effectiveness.",
      },
      {
        title: "Management",
        body: "Users can manage cookies from their browser settings. A consent banner may be added in a later phase.",
      },
    ],
  },
};

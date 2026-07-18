import {
  Activity,
  BadgeCheck,
  ClipboardCheck,
  HeartPulse,
  Microscope,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type SeoPageContent = {
  slug: string;
  enSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  cards: {
    title: string;
    description: string;
    icon: LucideIcon;
  }[];
  sections: {
    title: string;
    body: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
};

export const seoPagesEs: Record<string, SeoPageContent> = {
  "mantenimiento-equipos-medicos": {
    slug: "mantenimiento-equipos-medicos",
    enSlug: "medical-equipment-maintenance",
    eyebrow: "Mantenimiento biomédico",
    title: "Mantenimiento de equipos médicos en Panamá",
    description:
      "Servicio técnico preventivo y correctivo para equipos médicos, biomédicos, dentales, de laboratorio y diagnóstico. Soporte documentado para clínicas, hospitales e instituciones.",
    image: "/images/bbs-before-after-maintenance.png",
    imageAlt: "Antes y después de mantenimiento de equipo médico biomédico",
    keywords: [
      "mantenimiento equipos médicos Panamá",
      "servicio técnico biomédico",
      "mantenimiento preventivo equipos médicos",
      "reparación equipos médicos",
      "soporte biomédico Panamá",
    ],
    cards: [
      {
        title: "Preventivo",
        description:
          "Rutinas programadas para reducir fallas, desgaste prematuro y tiempos de parada clínica.",
        icon: ShieldCheck,
      },
      {
        title: "Correctivo",
        description:
          "Diagnóstico de fallas, reparación, validación funcional y recomendaciones técnicas.",
        icon: Wrench,
      },
      {
        title: "Documentado",
        description:
          "Reportes, evidencias, trazabilidad y comunicación clara para auditorías internas.",
        icon: ClipboardCheck,
      },
    ],
    sections: [
      {
        title: "Equipos que atendemos",
        body: "Trabajamos con microscopios, sillones dentales, equipos de anestesia, monitores, equipos de laboratorio, sistemas de soporte clínico, equipos de medición y dispositivos usados en entornos de salud. Cada caso se evalúa según marca, modelo, condición y disponibilidad de repuestos.",
      },
      {
        title: "Por qué el mantenimiento posiciona mejor a tu institución",
        body: "Un plan de mantenimiento biomédico protege continuidad operativa, seguridad del paciente, precisión diagnóstica y vida útil del activo. También facilita evidencia técnica para procesos de calidad, compras, auditorías y renovación de equipos.",
      },
      {
        title: "Cobertura y atención",
        body: "Atendemos Panamá Oeste, Ciudad de Panamá y solicitudes de instituciones que requieren coordinación técnica nacional o internacional. La prioridad se define por criticidad del equipo y alcance requerido.",
      },
    ],
    faqs: [
      {
        question: "¿BBS realiza mantenimiento preventivo y correctivo?",
        answer:
          "Sí. El servicio puede incluir evaluación inicial, mantenimiento preventivo, diagnóstico correctivo, reparación, pruebas funcionales y documentación técnica.",
      },
      {
        question: "¿Atienden equipos médicos de varias marcas?",
        answer:
          "Sí. BBS ofrece soporte multimarca según tipo de equipo, disponibilidad de información técnica, condición del dispositivo y repuestos requeridos.",
      },
      {
        question: "¿El servicio incluye reporte técnico?",
        answer:
          "Sí. Se puede entregar evidencia técnica, hallazgos, acciones realizadas y recomendaciones para seguimiento.",
      },
    ],
  },
  "soporte-biomedico": {
    slug: "soporte-biomedico",
    enSlug: "biomedical-support",
    eyebrow: "Soporte técnico biomédico",
    title: "Soporte biomédico para clínicas, hospitales y laboratorios",
    description:
      "Atención técnica para equipos médicos críticos, gestión de casos, soporte a usuarios, revisión de fallas, repuestos, instalación, puesta en marcha y seguimiento.",
    image: "/services/microscope-olympus-private.png",
    imageAlt: "Técnico biomédico revisando microscopio y componentes electrónicos",
    keywords: [
      "soporte biomédico Panamá",
      "soporte técnico equipos médicos",
      "ingeniería clínica Panamá",
      "técnicos biomédicos Panamá",
      "repuestos equipos médicos",
    ],
    cards: [
      {
        title: "Diagnóstico rápido",
        description:
          "Recepción del caso, revisión de síntomas, prioridad clínica y ruta de atención.",
        icon: Zap,
      },
      {
        title: "Soporte operativo",
        description:
          "Acompañamiento para instalación, uso, pruebas, mantenimiento y recuperación del equipo.",
        icon: Stethoscope,
      },
      {
        title: "Seguimiento",
        description:
          "Comunicación clara con el equipo clínico y documentación de estado del caso.",
        icon: Activity,
      },
    ],
    sections: [
      {
        title: "Soporte para continuidad clínica",
        body: "El soporte biomédico ayuda a evitar interrupciones, priorizar equipos críticos y mantener trazabilidad del estado técnico. Esto permite tomar decisiones rápidas cuando un dispositivo afecta atención, diagnóstico o operación.",
      },
      {
        title: "Marcas y tecnología",
        body: "El mercado usa equipos de fabricantes como Olympus, Nikon, Leica, Mindray, GE Healthcare, Philips, Dräger, Siemens Healthineers, Stryker, Welch Allyn, A-dec y otras marcas médicas. BBS puede evaluar equipos multimarca según alcance técnico y documentación disponible.",
      },
      {
        title: "Casos comunes",
        body: "Fallos intermitentes, equipos sin mantenimiento reciente, cables deteriorados, calibración vencida, problemas de alimentación eléctrica, partes desgastadas, errores de usuario y necesidad de puesta en marcha.",
      },
    ],
    faqs: [
      {
        question: "¿Puedo pedir soporte por WhatsApp?",
        answer:
          "Sí. Puedes enviar datos del equipo, marca, modelo, fotos, error reportado y urgencia para iniciar evaluación.",
      },
      {
        question: "¿BBS vende repuestos?",
        answer:
          "La gestión de repuestos depende del equipo, marca, disponibilidad y alcance del servicio solicitado.",
      },
      {
        question: "¿Atienden laboratorios y clínicas dentales?",
        answer:
          "Sí. El soporte cubre equipos biomédicos, laboratorio, odontología, monitoreo y áreas clínicas según evaluación.",
      },
    ],
  },
  "marcas-equipos-medicos": {
    slug: "marcas-equipos-medicos",
    enSlug: "medical-equipment-brands",
    eyebrow: "Soporte multimarca",
    title: "Marcas de equipos médicos y soporte técnico multimarca",
    description:
      "Página de referencia para equipos médicos, biomédicos, dentales y de laboratorio que pueden requerir mantenimiento, calibración, repuestos, instalación o soporte.",
    image: "/images/bbs-biomedical-solutions-lab.png",
    imageAlt: "Laboratorio biomédico con equipos médicos y herramientas técnicas",
    keywords: [
      "marcas equipos médicos Panamá",
      "soporte técnico Olympus Panamá",
      "mantenimiento microscopios Nikon Leica Olympus",
      "servicio técnico equipos dentales Panamá",
      "equipos biomédicos soporte multimarca",
    ],
    cards: [
      {
        title: "Diagnóstico",
        description:
          "Revisión técnica por tipo de equipo, marca, modelo, uso clínico y falla reportada.",
        icon: Microscope,
      },
      {
        title: "Mantenimiento",
        description:
          "Planes preventivos y correctivos para preservar seguridad y desempeño.",
        icon: HeartPulse,
      },
      {
        title: "Compatibilidad",
        description:
          "Evaluación de repuestos, accesorios, consumibles y documentación disponible.",
        icon: BadgeCheck,
      },
    ],
    sections: [
      {
        title: "Marcas mencionadas por tipo de operación",
        body: "En el sector salud se encuentran marcas como Olympus, Nikon, Leica, Zeiss, Mindray, GE Healthcare, Philips, Siemens Healthineers, Dräger, Stryker, Welch Allyn, A-dec, Midmark, Tuttnauer, Heine, Riester, B. Braun y otras. La mención de marcas es referencial y no implica representación oficial.",
      },
      {
        title: "Equipos que más requieren soporte",
        body: "Microscopios, sillones dentales, autoclaves, monitores de signos vitales, lámparas, equipos de anestesia, sistemas de aspiración, bombas, balanzas clínicas, equipos de laboratorio, instrumental y dispositivos de diagnóstico.",
      },
      {
        title: "Cómo solicitar evaluación",
        body: "Para acelerar la respuesta, envía marca, modelo, número de serie, síntoma reportado, fotos del equipo, ubicación y nivel de urgencia. Con esa información se define si aplica visita, revisión en taller o asesoría técnica.",
      },
    ],
    faqs: [
      {
        question: "¿BBS es distribuidor oficial de todas estas marcas?",
        answer:
          "No necesariamente. Las marcas se mencionan como referencia de equipos comunes en el mercado. Cualquier representación oficial debe confirmarse caso por caso.",
      },
      {
        question: "¿Pueden revisar equipos antiguos?",
        answer:
          "Sí, siempre que el estado del equipo permita evaluación segura y existan condiciones técnicas para diagnóstico.",
      },
      {
        question: "¿Qué información debo enviar?",
        answer:
          "Marca, modelo, número de serie, falla, fotos, área donde opera y urgencia clínica.",
      },
    ],
  },
};

export const seoPagesEn: Record<string, SeoPageContent> = {
  "medical-equipment-maintenance": {
    ...seoPagesEs["mantenimiento-equipos-medicos"],
    slug: "medical-equipment-maintenance",
    enSlug: "mantenimiento-equipos-medicos",
    eyebrow: "Biomedical maintenance",
    title: "Medical equipment maintenance in Panama",
    description:
      "Preventive and corrective technical service for medical, biomedical, dental, laboratory and diagnostic equipment with documented support.",
    keywords: [
      "medical equipment maintenance Panama",
      "biomedical technical service",
      "preventive maintenance medical equipment",
      "medical equipment repair",
      "biomedical support Panama",
    ],
    cards: [
      {
        title: "Preventive",
        description:
          "Scheduled routines to reduce failures, premature wear and clinical downtime.",
        icon: ShieldCheck,
      },
      {
        title: "Corrective",
        description:
          "Fault diagnosis, repair, functional validation and technical recommendations.",
        icon: Wrench,
      },
      {
        title: "Documented",
        description:
          "Reports, evidence, traceability and clear communication for internal audits.",
        icon: ClipboardCheck,
      },
    ],
    sections: [
      {
        title: "Equipment we service",
        body: "We work with microscopes, dental chairs, anesthesia equipment, monitors, laboratory equipment, clinical support systems, measurement equipment and devices used in healthcare environments. Each case is evaluated by brand, model, condition and spare parts availability.",
      },
      {
        title: "Why maintenance matters",
        body: "A biomedical maintenance plan protects operational continuity, patient safety, diagnostic precision and asset life. It also supports technical evidence for quality processes, purchasing, audits and equipment renewal decisions.",
      },
      {
        title: "Coverage and response",
        body: "We serve Panama Oeste, Panama City and institutions that require national or international technical coordination. Priority is defined by equipment criticality and required scope.",
      },
    ],
    faqs: [
      {
        question: "Does BBS provide preventive and corrective maintenance?",
        answer:
          "Yes. Service may include initial evaluation, preventive maintenance, corrective diagnosis, repair, functional testing and technical documentation.",
      },
      {
        question: "Do you support multiple medical equipment brands?",
        answer:
          "Yes. BBS provides multi-brand support according to equipment type, technical information, device condition and required spare parts.",
      },
      {
        question: "Does service include a technical report?",
        answer:
          "Yes. We can provide technical evidence, findings, performed actions and follow-up recommendations.",
      },
    ],
  },
  "biomedical-support": {
    ...seoPagesEs["soporte-biomedico"],
    slug: "biomedical-support",
    enSlug: "soporte-biomedico",
    eyebrow: "Biomedical technical support",
    title: "Biomedical support for clinics, hospitals and laboratories",
    description:
      "Technical attention for medical equipment, case management, failures, spare parts, installation, startup and follow-up.",
    keywords: [
      "biomedical support Panama",
      "medical equipment technical support",
      "clinical engineering Panama",
      "biomedical technicians Panama",
      "medical equipment spare parts",
    ],
    cards: [
      {
        title: "Fast diagnosis",
        description:
          "Case intake, symptom review, clinical priority and response path.",
        icon: Zap,
      },
      {
        title: "Operational support",
        description:
          "Support for installation, use, testing, maintenance and equipment recovery.",
        icon: Stethoscope,
      },
      {
        title: "Follow-up",
        description:
          "Clear communication with clinical teams and documentation of case status.",
        icon: Activity,
      },
    ],
    sections: [
      {
        title: "Support for clinical continuity",
        body: "Biomedical support helps avoid interruptions, prioritize critical equipment and maintain traceability of technical status. This enables faster decisions when a device affects care, diagnostics or operation.",
      },
      {
        title: "Brands and technology",
        body: "Healthcare organizations use equipment from manufacturers such as Olympus, Nikon, Leica, Mindray, GE Healthcare, Philips, Dräger, Siemens Healthineers, Stryker, Welch Allyn, A-dec and other medical brands. BBS can evaluate multi-brand equipment according to technical scope and available documentation.",
      },
      {
        title: "Common cases",
        body: "Intermittent failures, equipment without recent maintenance, damaged cables, expired calibration, electrical power issues, worn parts, user errors and startup needs.",
      },
    ],
    faqs: [
      {
        question: "Can I request support by WhatsApp?",
        answer:
          "Yes. You can send equipment data, brand, model, photos, reported error and urgency to begin evaluation.",
      },
      {
        question: "Does BBS manage spare parts?",
        answer:
          "Spare parts management depends on equipment, brand, availability and service scope.",
      },
      {
        question: "Do you support laboratories and dental clinics?",
        answer:
          "Yes. Support covers biomedical, laboratory, dental, monitoring and clinical equipment according to evaluation.",
      },
    ],
  },
  "medical-equipment-brands": {
    ...seoPagesEs["marcas-equipos-medicos"],
    slug: "medical-equipment-brands",
    enSlug: "marcas-equipos-medicos",
    eyebrow: "Multi-brand support",
    title: "Medical equipment brands and multi-brand technical support",
    description:
      "Reference page for medical, biomedical, dental and laboratory equipment that may need maintenance, calibration, spare parts, installation or support.",
    keywords: [
      "medical equipment brands Panama",
      "Olympus technical support Panama",
      "Nikon Leica Olympus microscope maintenance",
      "dental equipment technical service Panama",
      "multi-brand biomedical equipment support",
    ],
    cards: [
      {
        title: "Diagnosis",
        description:
          "Technical review by equipment type, brand, model, clinical use and reported failure.",
        icon: Microscope,
      },
      {
        title: "Maintenance",
        description:
          "Preventive and corrective plans to preserve safety and performance.",
        icon: HeartPulse,
      },
      {
        title: "Compatibility",
        description:
          "Review of spare parts, accessories, consumables and available documentation.",
        icon: BadgeCheck,
      },
    ],
    sections: [
      {
        title: "Brands mentioned by operation type",
        body: "Healthcare environments often use brands such as Olympus, Nikon, Leica, Zeiss, Mindray, GE Healthcare, Philips, Siemens Healthineers, Dräger, Stryker, Welch Allyn, A-dec, Midmark, Tuttnauer, Heine, Riester, B. Braun and others. Brand mentions are referential and do not imply official representation.",
      },
      {
        title: "Equipment that often needs support",
        body: "Microscopes, dental chairs, autoclaves, vital signs monitors, lamps, anesthesia equipment, suction systems, pumps, clinical scales, laboratory equipment, instruments and diagnostic devices.",
      },
      {
        title: "How to request evaluation",
        body: "To accelerate response, send brand, model, serial number, reported symptom, equipment photos, location and urgency level. With that information, we define whether a visit, workshop review or technical advisory applies.",
      },
    ],
    faqs: [
      {
        question: "Is BBS an official distributor for all these brands?",
        answer:
          "Not necessarily. Brands are mentioned as references for common equipment in the market. Any official representation must be confirmed case by case.",
      },
      {
        question: "Can you inspect older equipment?",
        answer:
          "Yes, as long as the equipment condition allows safe evaluation and technical diagnosis is feasible.",
      },
      {
        question: "What information should I send?",
        answer:
          "Brand, model, serial number, failure, photos, operating area and clinical urgency.",
      },
    ],
  },
};

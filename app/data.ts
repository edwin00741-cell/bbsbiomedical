import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  ClipboardCheck,
  HeartPulse,
  Microscope,
  Radiation,
  ShieldCheck,
  Stethoscope,
  Timer,
  Wrench,
  Zap,
} from "lucide-react";

export type Service = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type Project = {
  title: string;
  description: string;
  image: string;
  tag?: string;
};

export const services: Service[] = [
  {
    title: "Servicio Técnico",
    description:
      "Mantenimiento preventivo y correctivo para equipos de soporte vital, monitoreo y diagnóstico por imagen.",
    href: "/servicio-tecnico",
    icon: Wrench,
  },
  {
    title: "Metrología",
    description:
      "Calibración y verificación de equipos de medición médica bajo estándares internacionales y nacionales.",
    href: "/metrologia",
    icon: Activity,
  },
  {
    title: "Protección Radiológica",
    description:
      "Gestión integral de la seguridad radiológica, blindajes y control de calidad de equipos emisores.",
    href: "/proteccion-radiologica",
    icon: Radiation,
  },
  {
    title: "Gestión Regulatoria",
    description:
      "Asesoría técnica para trámites ante autoridades de salud y cumplimiento de normativas locales.",
    href: "/gestion-regulatoria",
    icon: ClipboardCheck,
  },
];

export const clients = [
  {
    name: "Hospital del Nino",
    logo: "/clients/hospital-del-nino.png",
  },
  {
    name: "Ministerio de Salud Panamá",
    logo: "/clients/minsa.png",
  },
  {
    name: "Ministerio de Educacion",
    logo: "/clients/ministerio-educacion.jpg",
  },
  {
    name: "Smithsonian",
    logo: "/clients/smithsonian.png",
  },
  {
    name: "Clinica Armonia",
    logo: "/clients/armonia.png",
  },
  {
    name: "Clinica Princess",
    logo: "/clients/clinica-princess.png",
  },
  {
    name: "Centro Vocacional de Chapala",
    logo: "/clients/centro-vocacional-chapala.png",
  },
  {
    name: "Alpha Media",
    logo: "/clients/alpha-media.jpg",
  },
];

export const projects: Project[] = [
  {
    title: "Mantenimiento Preventivo microscopios - Hospital Del Nino Dr. Jose Renan Esquivel",
    description:
      "Mantenimiento preventivo integral de equipos de microscopia de alta resolución para operación clínica continua.",
    image: "/services/microscope-hospital-nino.png",
    tag: "Hospital Del Nino",
  },
  {
    title: "Mant. preventivo y restauracion de microscopio Olympus - Cliente Privado",
    description:
      "Restauración, revisión eléctrica y calibración de óptica para equipo Olympus.",
    image: "/services/microscope-olympus-private.png",
    tag: "Cliente Privado",
  },
  {
    title: "Mantenimiento Preventivo y Correctivo Sillon Dental - Centro Vocacional de Chapala",
    description:
      "Revisión preventiva y correctiva de sistemas neumáticos, hidráulicos y líneas internas.",
    image: "/services/dental-chair-chapala.png",
    tag: "Centro Vocacional de Chapala",
  },
  {
    title: "Mantenimiento Preventivo y Correctivo Microscopios Lab. de Ciencias - Colegio Bilingue Biancheri",
    description:
      "Soporte técnico para microscopios de laboratorio educativo y diagnóstico óptico.",
    image: "/services/microscope-lab-ciencias.png",
    tag: "Colegio Bilingue Biancheri",
  },
  {
    title: "Mantenimiento Preventivo Equipo de anestesia de Oxido Nitroso - Clinica Dental Armonia",
    description:
      "Verificacion de flujo, presion y seguridad operativa en equipo de anestesia odontologica.",
    image: "/services/anesthesia-nitrous-armonia.png",
    tag: "Clinica Dental Armonia",
  },
  {
    title: "Instalacion y puesta en marcha de Aire Acondicionado - Colegio Moises Castillo Ocana",
    description:
      "Instalación, verificación y puesta en marcha de sistema de aire acondicionado.",
    image: "/services/air-conditioning-mcastillo.png",
    tag: "Colegio Moises Castillo Ocana",
  },
];

export const values = [
  "Rigor Científico Absoluto",
  "Ética y Transparencia Clínica",
  "Innovación Tecnológica Continua",
  "Compromiso con el Bienestar",
];

export const capabilities = [
  {
    title: "Taller de Alta Complejidad",
    description:
      "Equipado con instrumental de calibración trazable para reparaciones a nivel de componente.",
    icon: Microscope,
  },
  {
    title: "Stock Crítico de Repuestos",
    description:
      "Almacén de piezas originales para las principales marcas del mercado, minimizando tiempos de parada.",
    icon: BadgeCheck,
  },
  {
    title: "Soporte 24/7",
    description:
      "Atención de emergencias técnicas en menos de 4 horas para centros de cuidados críticos.",
    icon: Timer,
  },
];

export const radiationScope = [
  {
    title: "Verificación de Blindajes",
    description: "Mediciones in-situ de niveles de radiación en áreas adyacentes.",
    icon: ShieldCheck,
  },
  {
    title: "Protocolos ALARA",
    description:
      "Capacitación para equipos clínicos, técnicos y administrativos expuestos a radiación.",
    icon: Zap,
  },
  {
    title: "Manuales de Protección",
    description:
      "Documentación técnica obligatoria según normativa vigente para operación segura.",
    icon: ClipboardCheck,
  },
  {
    title: "Control de Calidad de Equipos",
    description:
      "Pruebas periódicas a Rayos X, CT, Mamografía y Fluoroscopia para garantizar la mínima dosis efectiva.",
    icon: HeartPulse,
  },
];

export const applicableSectors = [
  "Hospitales",
  "Clínicas Dentales",
  "Laboratorios",
  "Radiología Industrial",
  "Veterinaria",
];

export const alaraSteps = [
  {
    title: "Justificación",
    description: "Cada procedimiento debe producir un beneficio neto mayor al riesgo.",
  },
  {
    title: "Optimización",
    description: "Empleo de técnicas que minimicen la exposición sin perder precisión.",
  },
  {
    title: "Limitación",
    description: "Respeto estricto a los límites legales de dosis individual.",
  },
];

export const primaryIcon = Stethoscope;

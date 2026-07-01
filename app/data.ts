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
  "Hospital Del Niño",
  "Clínica Armonía",
  "Lab Diagnostik",
  "MedCenter",
  "HealthPlus",
];

export const projects: Project[] = [
  {
    title: "Hospital Del Niño: Red de Microscopía",
    description:
      "Mantenimiento preventivo integral de 45 unidades de microscopía de alta resolución para el departamento de hematología.",
    tag: "Institucional",
  },
  {
    title: "Clínica Privada",
    description:
      "Calibración de óptica y sistemas digitales en equipos Olympus de última generación.",
    tag: "Olympus specialized",
  },
  {
    title: "Sillón Dental Ergonómico",
    description:
      "Instalación y configuración de sistemas neumáticos e hidráulicos en centros odontológicos.",
  },
  {
    title: "Lab. de Ciencias",
    description:
      "Soporte técnico avanzado para equipos de análisis centrífugo y espectroscopía.",
  },
  {
    title: "Sistemas de Anestesia",
    description:
      "Aseguramiento de flujo y ventilación en quirófanos de alta complejidad.",
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

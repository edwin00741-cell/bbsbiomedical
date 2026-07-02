import type { MetadataRoute } from "next";

const baseUrl = "https://bbsbiomedical.com";

const spanishRoutes = [
  "",
  "/quienes-somos",
  "/servicio-tecnico",
  "/metrologia",
  "/proteccion-radiologica",
  "/gestion-regulatoria",
  "/clientes",
  "/portal-medico",
  "/soporte-tecnico",
  "/privacidad",
  "/terminos-condiciones",
  "/cookies",
];

const englishRoutes = [
  "/en",
  "/en/about",
  "/en/technical-service",
  "/en/metrology",
  "/en/radiological-protection",
  "/en/regulatory-management",
  "/en/clients",
  "/en/medical-portal",
  "/en/technical-support",
  "/en/privacy",
  "/en/terms",
  "/en/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [...spanishRoutes, ...englishRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/en" ? "weekly" : "monthly",
    priority: route === "" || route === "/en" ? 1 : 0.8,
  }));
}

import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BackToTopButton } from "./back-to-top-button";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bbsbiomedical.com"),
  applicationName: "Biomedical Business and Service",
  title: {
    default: "Biomedical Business and Service",
    template: "%s | Biomedical Business and Service",
  },
  description:
    "Servicio técnico biomédico, metrología, protección radiológica y gestión regulatoria para instituciones de salud en Panamá.",
  openGraph: {
    type: "website",
    locale: "es_PA",
    url: "https://bbsbiomedical.com",
    siteName: "Biomedical Business and Service",
    title: "Biomedical Business and Service",
    description:
      "Servicio técnico biomédico, metrología, protección radiológica y gestión regulatoria para instituciones de salud en Panamá.",
    images: [
      {
        url: "/brand/bbs-primary-horizontal-color.png",
        width: 3270,
        height: 838,
        alt: "Biomedical Business and Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biomedical Business and Service",
    description:
      "Servicio técnico biomédico, metrología, protección radiológica y gestión regulatoria para instituciones de salud en Panamá.",
    images: ["/brand/bbs-primary-horizontal-color.png"],
  },
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/en",
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/brand/bbs-symbol-color.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Biomedical Business and Service",
    alternateName: "BBS",
    url: "https://bbsbiomedical.com",
    email: "brodriguez@rysbioservices.com",
    telephone: ["+50762023206", "+50766312007"],
    image: "https://bbsbiomedical.com/brand/bbs-primary-horizontal-color.png",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Ave. Libertadores, Calle los Libertadores, al lado de la Planta de hielo, Edificio 1, Local 1",
      addressLocality: "La Chorrera",
      addressRegion: "Panamá Oeste",
      addressCountry: "PA",
    },
    areaServed: ["Panamá", "Panamá Oeste", "La Chorrera", "Worldwide"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "12:00",
      },
    ],
    makesOffer: [
      "Servicio técnico biomédico",
      "Metrología biomédica",
      "Protección radiológica",
      "Gestión regulatoria",
    ],
  };

  return (
    <html lang="es">
      <body>
        {gtmId ? (
          <noscript>
            <iframe
              height="0"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              style={{ display: "none", visibility: "hidden" }}
              width="0"
            />
          </noscript>
        ) : null}
        {children}
        <BackToTopButton />
        <Script
          id="bbs-local-business-schema"
          strategy="beforeInteractive"
          type="application/ld+json"
        >
          {JSON.stringify(localBusinessSchema)}
        </Script>
        <Analytics />
        <SpeedInsights />
        {gtmId ? (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        ) : null}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-R3CEHXMM3F"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-R3CEHXMM3F');
          `}
        </Script>
      </body>
    </html>
  );
}

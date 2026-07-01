import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BBS Biomedical Solutions",
  description:
    "Servicio técnico biomédico, metrología, protección radiológica y gestión regulatoria para instituciones de salud.",
  icons: {
    icon: "/brand/bbs-icon-black.svg",
    apple: "/brand/bbs_symbol_color_8x.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

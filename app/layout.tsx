import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BBS Services",
  description: "Soluciones digitales, soporte operativo y servicios profesionales.",
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

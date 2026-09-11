import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHALLENGE — Indumentaria deportiva",
  description:
    "Sets, camperas y accesorios deportivos con envío a todo el país. Comprá online y pagá con Mercado Pago.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <div className="brand-watermark" />
        {children}
      </body>
    </html>
  );
}

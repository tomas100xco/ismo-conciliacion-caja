import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Proveedor } from "@/lib/store";
import { ProveedorFeedback } from "@/lib/feedback";

export const metadata: Metadata = {
  title: "Conciliación de Caja · ISMO Motors",
  description:
    "Un folio por factura. Cada documento que entra se lee y se valida contra los anteriores en el mismo momento.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C252E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Barlow:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        <Proveedor>
          <ProveedorFeedback>{children}</ProveedorFeedback>
        </Proveedor>
      </body>
    </html>
  );
}

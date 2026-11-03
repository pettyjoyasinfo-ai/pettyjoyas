import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond, Charm } from "next/font/google";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/site";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Cursiva del hero (equivalente a --tp-ff-charm de la plantilla original)
const charm = Charm({
  variable: "--font-charm",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Joyería de calidad`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  manifest: "/manifest.webmanifest",
  applicationName: SITE.name,
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
  // El ícono principal ahora lo sirve Next.js solo desde app/icon.png y
  // app/favicon.ico (convención de archivos) — acá solo queda el apple-touch-icon,
  // que no tiene su propia convención de archivo todavía.
  icons: {
    apple: "/assets/img/logo/favicon-petty.png",
  },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    type: "website",
    locale: "es_AR",
  },
  // Meta (Facebook/Instagram) exige esta etiqueta para verificar que el
  // dominio es nuestro antes de habilitar Conversions API / audiencias.
  verification: {
    other: {
      "facebook-domain-verification":
        process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION || "rj226bdd15fue3brl21lut0ceeonbl",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#821f40",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jost.variable} ${cormorant.variable} ${charm.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

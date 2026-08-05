import type { NextConfig } from "next";

// Permite que Next.js Image optimice imágenes subidas al storage del backend.
// El hostname se deriva de NEXT_PUBLIC_API_URL en build time.
// NOTA: api.pettyjoyas.com.ar está hardcodeado como fallback garantizado para
// producción (Vercel). Si NEXT_PUBLIC_API_URL no está definido en el build,
// el dominio de producción igual queda en la whitelist.
const apiRemotePattern = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Caché del router en el navegador (distinta de `revalidate` del servidor):
  // sin esto, páginas estáticas como la home quedan hasta 5 min "pegadas" en
  // el cliente al navegar con links, aunque el servidor ya tenga la versión
  // nueva — por eso los cambios de apariencia solo se veían con Ctrl+R.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 60,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Dominio de producción hardcodeado: garantiza que las imágenes del backend
      // funcionen en Vercel aunque NEXT_PUBLIC_API_URL no esté seteado en build time.
      { protocol: "https", hostname: "api.pettyjoyas.com.ar" },
      ...(apiRemotePattern ? [apiRemotePattern] : []),
    ],
    // Evita el error 402 Payment Required de Vercel (límite de cuota de optimización de imágenes en Vercel Hobby).
    // Las imágenes se cargan directamente desde la URL del backend (Hostinger) sin pasar por /_next/image.
    unoptimized: true,
  },
};

export default nextConfig;

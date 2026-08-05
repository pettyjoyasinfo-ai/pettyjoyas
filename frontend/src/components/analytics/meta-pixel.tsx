"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// El ID lo dio la clienta al crear el Pixel en Meta Business Manager (Meta
// Ads → Configurar). Se puede pisar por env sin tocar código si algún día
// cambia de cuenta de Meta.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1888918268652743";

/**
 * Es una SPA (Next.js App Router): el script base solo corre una vez al
 * cargar la página, así que sin esto casi todas las navegaciones internas
 * (ir de /tienda a /producto/x, etc.) no se contarían como PageView para
 * Meta. Dispara un evento en cada cambio de ruta.
 */
function MetaPixelPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.fbq?.("track", "PageView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('set', 'autoConfig', false, '${PIXEL_ID}');
        fbq('init', '${PIXEL_ID}');`}
      </Script>
      <Suspense fallback={null}>
        <MetaPixelPageviews />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import Script from "next/script";
import { SectionHeading } from "@/components/ui/section-heading";
import { SITE } from "@/lib/site";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/**
 * Galería de Instagram con el embed oficial de Instagram (gratis, sin API key).
 * Cada post se renderiza dentro de su propio iframe (lo arma el script de
 * Instagram), así que no contamina el CSS del resto del sitio — a diferencia
 * de Juicer, que inyectaba un build de Tailwind global y rompía utilidades
 * de translate en todo el sitio (carrito, menú móvil).
 * Los links se cargan desde el admin (Apariencia → Galería de Instagram).
 */
export function InstagramFeed({ urls }: { urls?: string[] }) {
  // Memoizado por contenido (no por referencia): `urls` puede llegar con un
  // array nuevo en cada render del padre aunque los links no cambien, y sin
  // esto el efecto de abajo reprocesaba los embeds de Instagram en CADA
  // render — generaba pedidos repetidos a Instagram por cada iframe
  // (visible como spam de "Tracking Prevention blocked..." en la consola).
  const key = (urls ?? []).slice(0, 6).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const posts = useMemo(() => (urls ?? []).slice(0, 6), [key]);

  // Re-procesa los blockquotes cada vez que cambia la lista (el script de
  // Instagram solo escanea el DOM una vez al cargar).
  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, [posts]);

  return (
    <section className="py-20">
      <div className="container-px">
        <SectionHeading eyebrow="@pettyjoyas" title="Seguinos en Instagram" />

        {posts.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted">Próximamente, nuestras últimas publicaciones acá.</p>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              Ver @pettyjoyas en Instagram
            </a>
          </div>
        ) : (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {posts.map((url) => (
              <div key={url} className="w-[326px] shrink-0">
                {/* eslint-disable-next-line react/no-unknown-property */}
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={url}
                  data-instgrm-version="14"
                  style={{ margin: 0, width: "100%" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" onLoad={() => window.instgrm?.Embeds.process()} />
    </section>
  );
}

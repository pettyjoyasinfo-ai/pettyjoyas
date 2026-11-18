"use client";

import { useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import { HERO_ASPECTS, type HeroAspect, type HeroSlide } from "@/lib/data/settings";

/**
 * Hero del inicio: carrusel de imágenes completas (sin textos ni fondo encima; si quieren
 * texto, va dentro de la imagen). En PC se ven 2 imágenes lado a lado y en el celular 1.
 * Todas con el mismo formato (se elige en el panel) para que no se recorten de forma rara.
 */
export function HeroSlider({ slides, aspect = "4/3" }: { slides: HeroSlide[]; aspect?: HeroAspect }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const visible = slides.filter((s) => s.enabled !== false && s.image?.trim());
  if (visible.length === 0) return null;

  // Con una sola imagen, en PC ocupa todo el ancho (no queda media pantalla vacía).
  const perViewDesktop = visible.length >= 2 ? 2 : 1;
  const ratio = HERO_ASPECTS[aspect]?.css ?? "4 / 3";
  const showArrows = visible.length > 1;

  return (
    <section className="hero-slider relative overflow-hidden bg-stone-bg">
      <Swiper
        modules={[Autoplay, Pagination]}
        speed={700}
        autoplay={visible.length > 1 ? { delay: 6000, disableOnInteraction: false } : false}
        pagination={visible.length > 1 ? { clickable: true } : false}
        // "rewind" en vez de "loop": funciona con cualquier cantidad de imágenes (loop pide un mínimo).
        rewind
        slidesPerView={1}
        breakpoints={{ 768: { slidesPerView: perViewDesktop, slidesPerGroup: perViewDesktop } }}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
      >
        {visible.map((slide, i) => {
          const hasText = !!(slide.eyebrow?.trim() || slide.title?.trim() || (slide.href && slide.cta?.trim()));
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title || "Petty Joyas"}
              loading={i < 2 ? "eager" : "lazy"}
              fetchPriority={i < 2 ? "high" : "auto"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          );
          // Texto opcional de cada imagen: abajo a la izquierda, con un degradé oscuro suave
          // para que se lea sobre fotos claras. Sin texto, la imagen queda limpia.
          const text = hasText && (
            <>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 pb-9 text-white sm:p-7 sm:pb-10 lg:p-9 lg:pb-12">
                {slide.eyebrow?.trim() && (
                  <span className="font-script text-xl leading-tight sm:text-2xl lg:text-3xl">{slide.eyebrow}</span>
                )}
                {slide.title?.trim() && (
                  <span className="mt-1 font-display text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{slide.title}</span>
                )}
                {slide.href && slide.cta?.trim() && (
                  <span className="mt-4 inline-block border border-white/85 px-5 py-2 text-xs font-medium transition group-hover:bg-white group-hover:text-ink sm:text-sm">
                    {slide.cta}
                  </span>
                )}
              </span>
            </>
          );
          return (
            <SwiperSlide key={slide.id ?? i}>
              <div className="relative w-full" style={{ aspectRatio: ratio }}>
                {slide.href ? (
                  <Link href={slide.href} prefetch={false} aria-label={slide.title || slide.cta || "Ver más"} className="group block h-full w-full">
                    {img}
                    {text}
                  </Link>
                ) : (
                  <>
                    {img}
                    {text}
                  </>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-md transition hover:bg-white sm:grid lg:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-md transition hover:bg-white sm:grid lg:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
}

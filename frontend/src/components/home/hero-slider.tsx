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
          return (
            <SwiperSlide key={slide.id ?? i}>
              <div className="relative w-full" style={{ aspectRatio: ratio }}>
                {slide.href ? (
                  <Link href={slide.href} prefetch={false} aria-label={slide.title || "Ver más"} className="block h-full w-full">
                    {img}
                  </Link>
                ) : (
                  img
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

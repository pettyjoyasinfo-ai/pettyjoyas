"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import type { HeroSlide } from "@/lib/data/settings";

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const visible = slides.filter((s) => s.enabled !== false);

  return (
    <section className="hero-slider relative overflow-hidden bg-khaki">
      <Swiper
        modules={[Autoplay, Pagination]}
        speed={700}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
      >
        {visible.map((slide, i) => (
          <SwiperSlide key={slide.id ?? i}>
            <div className="relative flex min-h-[520px] items-end overflow-hidden bg-khaki pb-16 sm:min-h-[680px] sm:items-center sm:pb-10 lg:min-h-[800px] xl:min-h-[880px]">

              {/* Aro decorativo — más visible en mobile, posicionado a la derecha con la imagen */}
              <span className="pointer-events-none absolute -bottom-[160px] right-[-80px] h-[480px] w-[480px] rounded-full border border-white/30 sm:hidden" />
              <span className="pointer-events-none absolute -bottom-[180px] right-[-60px] h-[380px] w-[380px] rounded-full border border-white/15 sm:hidden" />
              {/* Aros desktop */}
              <span className="pointer-events-none absolute -bottom-[210px] left-1/2 hidden h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-white/[0.04] sm:block" />
              <span className="pointer-events-none absolute -bottom-[249px] left-[46%] hidden h-[800px] w-[800px] -translate-x-1/2 rounded-full border border-white/20 sm:block" />

              {/* Imagen del modelo */}
              <div className="absolute bottom-0 right-0 h-[78%] w-[62%] sm:left-1/2 sm:right-auto sm:h-[80%] sm:w-[min(92vw,680px)] sm:-translate-x-[40%] lg:h-[88%]">
                {slide.image.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-contain object-bottom"
                  />
                ) : (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 640px) 62vw, (max-width: 1024px) 92vw, 680px"
                    className="object-contain object-bottom"
                  />
                )}
              </div>

              {/* Gradiente izquierdo — solo mobile */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-khaki via-khaki/80 to-transparent sm:hidden" />

              {/* Contenido textual */}
              <div className="container-px relative z-10 w-full pb-2 sm:pb-0">
                <div className="max-w-[52%] sm:max-w-xl">
                  {slide.eyebrow && (
                    <span className="font-script text-2xl text-white sm:text-3xl sm:text-[40px]">
                      {slide.eyebrow}
                    </span>
                  )}
                  <h1 className="mt-2 mb-5 font-sans text-[38px] font-normal leading-[0.95] tracking-[-0.03em] text-white sm:mt-3 sm:mb-9 sm:text-[72px] lg:text-[88px] xl:text-[100px]">
                    {slide.title}
                  </h1>
                  <Link
                    href={slide.href ?? "/tienda"}
                    className="inline-block border border-white/80 px-6 py-2 text-sm font-medium text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-ink sm:px-8 sm:py-2.5 sm:text-base"
                  >
                    Descubrir ahora
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Flecha anterior — pequeña en mobile (bottom), grande en desktop (center) */}
      <button
        type="button"
        aria-label="Slide anterior"
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute bottom-3 left-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/40 text-white/80 transition hover:border-white hover:bg-white hover:text-ink sm:bottom-auto sm:left-4 sm:top-1/2 sm:h-[54px] sm:w-[54px] sm:-translate-y-1/2 lg:left-8"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>

      {/* Flecha siguiente */}
      <button
        type="button"
        aria-label="Slide siguiente"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute bottom-3 left-14 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/40 text-white/80 transition hover:border-white hover:bg-white hover:text-ink sm:bottom-auto sm:left-auto sm:right-4 sm:top-1/2 sm:h-[54px] sm:w-[54px] sm:-translate-y-1/2 lg:right-8"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>
    </section>
  );
}

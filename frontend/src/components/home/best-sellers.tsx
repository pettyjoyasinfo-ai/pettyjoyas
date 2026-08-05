"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/lib/types";

export function BestSellers({ products }: { products: Product[] }) {
  return (
    <section className="container-px py-20">
      <SectionHeading eyebrow="Lo más vendido de la semana" title="Top de la temporada" />

      <div className="relative">
        <Swiper
          modules={[Navigation]}
          navigation={{ prevEl: ".best-prev", nextEl: ".best-next" }}
          spaceBetween={20}
          slidesPerView={2}
          breakpoints={{
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="!h-auto pb-2">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          className="best-prev absolute -left-3 top-[38%] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-md transition hover:bg-brand hover:text-white"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          className="best-next absolute -right-3 top-[38%] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-md transition hover:bg-brand hover:text-white"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

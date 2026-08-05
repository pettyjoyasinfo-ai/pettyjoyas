import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DEFAULT_SETTINGS, type CollectionSettings } from "@/lib/data/settings";

export function CollectionSplit({ data }: { data?: CollectionSettings }) {
  const col = data ?? DEFAULT_SETTINGS.collection;

  return (
    <section className="py-10">
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl lg:grid-cols-2">
          {/* Imagen grande con texto vertical */}
          <div className="relative min-h-[420px] bg-stone-bg">
            <Image
              src={col.image}
              alt="Nueva colección"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold uppercase tracking-[0.3em] text-white/90 [transform-origin:left]">
              {col.sideText}
            </span>
          </div>

          {/* Lado derecho */}
          <div className="relative flex items-center justify-center bg-[#F6F6F6] px-6 py-16">
            <div className="max-w-sm text-center">
              <span className="section-subtitle">{col.eyebrow}</span>
              <div className="relative mx-auto mt-6 aspect-square w-64 overflow-hidden rounded-2xl bg-white">
                <Image
                  src={col.smallImage}
                  alt={col.title}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-6 font-display text-3xl text-ink">{col.title}</h3>
              <Link
                href={col.ctaHref}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 transition hover:text-brand hover:underline"
              >
                {col.ctaText} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

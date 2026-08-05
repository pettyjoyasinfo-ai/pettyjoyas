import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Category } from "@/lib/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const roots = categories.filter((c) => !c.parentSlug);
  return (
    <section className="bg-[#EFF1F5] py-20">
      <div className="container-px">
        <SectionHeading
          eyebrow="Comprá por categoría"
          title="Todo el universo de la joyería"
          description="Anillos, collares, aros, pulseras, conjuntos y relojes. Encontrá la pieza perfecta para cada ocasión."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {roots.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tienda?categoria=${cat.slug}`}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-white p-5 text-center transition hover:shadow-[0_12px_30px_rgba(1,15,28,0.08)]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-bg">
                <Image
                  src={cat.image ?? ""}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 40vw, 16vw"
                  className="object-cover card-hover-img"
                />
              </div>
              <div>
                <h3 className="font-display text-lg text-ink transition group-hover:text-brand">
                  {cat.name}
                </h3>
                <span className="text-xs text-muted">Ver productos</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import { DEFAULT_SETTINGS, type BrandsSettings } from "@/lib/data/settings";

/**
 * Carrusel de marcas con las que trabaja la joyería (Casio, Rolex, etc.).
 * Marquee continuo en CSS (sin JS). El contenido se edita en /admin/banners.
 */
export function BrandsCarousel({ data }: { data?: BrandsSettings }) {
  const brands = data ?? DEFAULT_SETTINGS.brands;
  const loop = [...brands.items, ...brands.items];

  return (
    <section className="border-y border-line bg-cream">
      <div className="container-px py-12">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {brands.heading}
        </p>
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-[brand-marquee_32s_linear_infinite] items-center gap-14 group-hover:[animation-play-state:paused]">
            {loop.map((b, i) => (
              <span
                key={`${b.id}-${i}`}
                className="font-display text-3xl font-medium tracking-wide text-ink/35 transition-colors hover:text-brand"
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

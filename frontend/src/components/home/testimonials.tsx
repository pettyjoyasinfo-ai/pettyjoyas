import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Widget de Google Reviews (Elfsight), cargado en un iframe hacia una página
 * estática propia (public/embeds/google-reviews.html) en vez de inyectar el
 * script directo en el documento principal: Elfsight trae su propio CSS
 * global, y ya tuvimos un caso (Juicer) donde un embed así rompió utilidades
 * de Tailwind del resto del sitio (carrito, menú). El iframe aísla ese riesgo.
 */
export function Testimonials() {
  return (
    <section className="bg-khaki-100 py-20">
      <div className="container-px">
        <SectionHeading eyebrow="Lo que dicen" title="Clientes que brillan con nosotros" />
        <iframe
          src="/embeds/google-reviews.html"
          title="Reseñas de Google de Petty Joyas"
          loading="lazy"
          className="h-[420px] w-full rounded-2xl border-0"
        />
      </div>
    </section>
  );
}

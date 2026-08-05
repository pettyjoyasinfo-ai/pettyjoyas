import Link from "next/link";
import { Instagram, Mail, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { getCategories } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/data/seed";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { Logo } from "@/components/layout/logo";

export async function SiteFooter() {
  const categories = await getCategories().catch(() => [...CATEGORIES]);

  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="container-px grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        {/* Marca */}
        <div className="lg:col-span-2">
          <Logo variant="light" className="text-3xl" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            {SITE.description}
          </p>
          <div className="mt-6 flex flex-col gap-2.5 text-sm">
            <a href={`tel:${SITE.phone}`} className="flex items-center gap-2.5 hover:text-white">
              <Phone className="h-4 w-4 text-gold" /> {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 hover:text-white">
              <Mail className="h-4 w-4 text-gold" /> {SITE.email}
            </a>
          </div>
          <div className="mt-6 flex gap-3">
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:border-gold hover:bg-gold hover:text-ink"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Tienda */}
        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-white">
            Tienda
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            {categories.filter((c) => !c.parentSlug).slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/tienda?categoria=${c.slug}`}
                  className="text-white/60 transition hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-white">
            Ayuda
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            {[
              ["Sobre nosotros", "/nosotros"],
              ["Preguntas frecuentes", "/ayuda"],
              ["Envíos y devoluciones", "/envios"],
              ["Guía de talles", "/guia-de-talles"],
              ["Cuidado de tus joyas", "/cuidados"],
              ["Contacto", "/contacto"],
              ["Políticas y privacidad", "/politicas"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-white/60 transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-white">
            Newsletter
          </h3>
          <p className="mb-4 text-sm text-white/60">
            Suscribite y recibirás novedades y descuentos exclusivos.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-px flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. Todos los derechos reservados.
            {" "}Desarrollado por{" "}
            <a
              href="https://mateorojas.com.ar"
              target="_blank"
              rel="noreferrer"
              className="text-white/70 underline underline-offset-2 hover:text-white"
            >
              Mateo Rojas
            </a>
          </p>
          <div className="flex items-center gap-4">
            <p>Medios de pago: MercadoPago · Tarjetas · Transferencia</p>
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/30 transition hover:border-white/25 hover:text-white/60"
            >
              Panel admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

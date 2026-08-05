import { CATEGORIES } from "@/lib/data/seed";

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

/** Menú principal del sitio (derivado de las categorías mock). */
export const MAIN_NAV: NavLink[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Tienda",
    href: "/tienda",
    children: CATEGORIES.map((c) => ({
      label: c.name,
      href: `/tienda?categoria=${c.slug}`,
    })),
  },
  { label: "Ofertas", href: "/tienda?oferta=1" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

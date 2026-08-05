/**
 * Contenido visual editable de la home (MOCK).
 *
 * Fuente ÚNICA que comparten los componentes de la home y el panel
 * "Apariencia" del admin: lo que se edita ahí es exactamente lo que se ve.
 * En producción esto vive en la API de Laravel (tabla de "apariencia/banners").
 */

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  href: string;
  enabled: boolean;
};

export type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  href: string;
  cta: boolean;
  /** Ubicación en la grilla de banners de la home. */
  slot: "principal" | "chico-1" | "chico-2" | "alto";
};

export type Brand = {
  id: string;
  name: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  { id: "hero-1", eyebrow: "El original", title: "Brillá siempre", image: "/assets/img/slider/4/slider-1.png", href: "/tienda", enabled: true },
  { id: "hero-2", eyebrow: "El original", title: "Recién llegadas", image: "/assets/img/slider/4/slider-2.png", href: "/tienda?orden=nuevos", enabled: true },
  { id: "hero-3", eyebrow: "El original", title: "Bañadas en oro", image: "/assets/img/slider/4/slider-3.png", href: "/tienda?material=oro", enabled: true },
  { id: "hero-4", eyebrow: "El original", title: "Formas únicas", image: "/assets/img/slider/4/slider-4.png", href: "/tienda?oferta=1", enabled: true },
];

export const BANNERS: Banner[] = [
  { id: "ban-1", eyebrow: "Colección", title: "Anillos Art Déco 2024", image: "/assets/img/banner/4/banner-1.jpg", href: "/tienda?categoria=anillos", cta: true, slot: "principal" },
  { id: "ban-2", eyebrow: "Tendencia", title: "Conjuntos coordinados", image: "/assets/img/banner/4/banner-2.jpg", href: "/tienda?categoria=conjuntos", cta: false, slot: "chico-1" },
  { id: "ban-3", eyebrow: "Recién llegado", title: "Joyas en oro", image: "/assets/img/banner/4/banner-3.jpg", href: "/tienda?material=oro", cta: false, slot: "chico-2" },
  { id: "ban-4", eyebrow: "Colección", title: "Anillos de oro con diamantes", image: "/assets/img/banner/4/banner-4.jpg", href: "/tienda?categoria=anillos", cta: true, slot: "alto" },
];

export const ABOUT = {
  eyebrow: "Colección Unity",
  title: "Ediciones limitadas, hechas para durar",
  paragraphs: [
    "Seleccionamos cada pieza combinando materiales nobles y buena terminación. Joyas pensadas para acompañarte en los momentos que importan —y para regalar lo que no se olvida.",
    "Anillos, collares, aros, pulseras y conjuntos: todo el universo de la joyería, con la calidad y el detalle que nos define.",
  ],
  image1: "/assets/img/about/about-1.jpg",
  image2: "/assets/img/about/about-2.jpg",
  ctaText: "Contactanos",
  ctaHref: "/contacto",
};

export const COLLECTION = {
  sideText: "Con nuevo look y nueva colección",
  eyebrow: "Armá tu propio set",
  title: "Nuestras mejores joyas",
  image: "/assets/img/product/collection/4/collection-1.jpg",
  smallImage: "/assets/img/product/collection/4/collection-sm-1.jpg",
  ctaText: "Ver esta colección",
  ctaHref: "/tienda?categoria=conjuntos",
};

/** Marcas con las que trabaja la joyería (decisión del cliente: relojería/joyería). */
export const BRANDS_HEADING = "Trabajamos con las mejores marcas";
export const BRANDS: Brand[] = [
  { id: "b-casio", name: "CASIO" },
  { id: "b-rolex", name: "ROLEX" },
  { id: "b-citizen", name: "CITIZEN" },
  { id: "b-seiko", name: "SEIKO" },
  { id: "b-tissot", name: "TISSOT" },
  { id: "b-swatch", name: "SWATCH" },
  { id: "b-festina", name: "FESTINA" },
  { id: "b-pandora", name: "PANDORA" },
];

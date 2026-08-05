import { apiFetch, isApiConfigured } from "@/lib/api/client";

/**
 * Configuración del sitio editable desde el admin.
 * Lee de la API de Laravel (/settings) y cae a los defaults si el backend está
 * apagado o falla. Seguro de importar en server y cliente.
 */

export type AnnouncementItem = { icon?: string; text: string };
export type FeatureItem = { icon?: string; title: string; text?: string };
export type HeroSlide = {
  id?: string;
  eyebrow?: string;
  title: string;
  image: string;
  href?: string;
  enabled?: boolean;
};

export type BadgeSettings = {
  nuevo: boolean;
  oferta: boolean;
  destacado: boolean;
  agotado: boolean;
};

export type BannerItem = {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  href: string;
  cta: boolean;
  slot: "principal" | "chico-1" | "chico-2" | "alto";
};

export type AboutSettings = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image1: string;
  image2: string;
  ctaText: string;
  ctaHref: string;
};

export type CollectionSettings = {
  sideText: string;
  eyebrow: string;
  title: string;
  image: string;
  smallImage: string;
  ctaText: string;
  ctaHref: string;
};

export type BrandItem = { id: string; name: string };
export type BrandsSettings = { heading: string; items: BrandItem[] };

export type InstagramSettings = { urls: string[] };

export type SiteSettings = {
  announcement: { enabled: boolean; items: AnnouncementItem[] };
  features: { items: FeatureItem[] };
  hero: { slides: HeroSlide[] };
  badges: BadgeSettings;
  banners: { items: BannerItem[] };
  about: AboutSettings;
  collection: CollectionSettings;
  brands: BrandsSettings;
  instagram: InstagramSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    items: [
      { icon: "Truck", text: "Envío gratis desde $80.000" },
      { icon: "Sparkles", text: "3 cuotas sin interés · Más de 30 años de trayectoria" },
    ],
  },
  features: {
    items: [
      { icon: "Truck", title: "Envío a todo el país", text: "Gratis desde $80.000" },
      { icon: "ShieldCheck", title: "Compra protegida", text: "Pago seguro con MercadoPago" },
      { icon: "RefreshCcw", title: "Cambios sin vueltas", text: "30 días para cambios" },
      { icon: "Gem", title: "Garantía de por vida", text: "En el armado de cada pieza" },
    ],
  },
  hero: {
    slides: [
      { id: "hero-1", eyebrow: "El original", title: "Brillá siempre",   image: "/assets/img/slider/4/slider-1.png", href: "/tienda",              enabled: true },
      { id: "hero-2", eyebrow: "El original", title: "Recién llegadas",  image: "/assets/img/slider/4/slider-2.png", href: "/tienda?orden=nuevos", enabled: true },
      { id: "hero-3", eyebrow: "El original", title: "Bañadas en oro",   image: "/assets/img/slider/4/slider-3.png", href: "/tienda?material=oro", enabled: true },
      { id: "hero-4", eyebrow: "El original", title: "Formas únicas",    image: "/assets/img/slider/4/slider-4.png", href: "/tienda?oferta=1",     enabled: true },
    ],
  },
  badges: {
    nuevo: true,
    oferta: true,
    destacado: true,
    agotado: true,
  },
  banners: {
    items: [
      { id: "ban-1", eyebrow: "Colección",     title: "Anillos Art Déco 2024",        image: "/assets/img/banner/4/banner-1.jpg", href: "/tienda?categoria=anillos",    cta: true,  slot: "principal" },
      { id: "ban-2", eyebrow: "Tendencia",      title: "Conjuntos coordinados",        image: "/assets/img/banner/4/banner-2.jpg", href: "/tienda?categoria=conjuntos", cta: false, slot: "chico-1" },
      { id: "ban-3", eyebrow: "Recién llegado", title: "Joyas en oro",                 image: "/assets/img/banner/4/banner-3.jpg", href: "/tienda?material=oro",        cta: false, slot: "chico-2" },
      { id: "ban-4", eyebrow: "Colección",      title: "Anillos de oro con diamantes", image: "/assets/img/banner/4/banner-4.jpg", href: "/tienda?categoria=anillos",    cta: true,  slot: "alto" },
    ],
  },
  about: {
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
  },
  collection: {
    sideText: "Con nuevo look y nueva colección",
    eyebrow: "Armá tu propio set",
    title: "Nuestras mejores joyas",
    image: "/assets/img/product/collection/4/collection-1.jpg",
    smallImage: "/assets/img/product/collection/4/collection-sm-1.jpg",
    ctaText: "Ver esta colección",
    ctaHref: "/tienda?categoria=conjuntos",
  },
  brands: {
    heading: "Trabajamos con las mejores marcas",
    items: [
      { id: "b-casio",   name: "CASIO" },
      { id: "b-rolex",   name: "ROLEX" },
      { id: "b-citizen", name: "CITIZEN" },
      { id: "b-seiko",   name: "SEIKO" },
      { id: "b-tissot",  name: "TISSOT" },
      { id: "b-swatch",  name: "SWATCH" },
      { id: "b-festina", name: "FESTINA" },
      { id: "b-pandora", name: "PANDORA" },
    ],
  },
  instagram: {
    urls: [],
  },
};

export async function getSettings(): Promise<SiteSettings> {
  if (!isApiConfigured()) return DEFAULT_SETTINGS;
  try {
    const data = await apiFetch<Partial<SiteSettings>>("/settings");
    return {
      announcement: data.announcement ?? DEFAULT_SETTINGS.announcement,
      features:     data.features     ?? DEFAULT_SETTINGS.features,
      hero:         data.hero         ?? DEFAULT_SETTINGS.hero,
      badges:       data.badges       ?? DEFAULT_SETTINGS.badges,
      banners:      data.banners      ?? DEFAULT_SETTINGS.banners,
      about:        data.about        ?? DEFAULT_SETTINGS.about,
      collection:   data.collection   ?? DEFAULT_SETTINGS.collection,
      brands:       data.brands       ?? DEFAULT_SETTINGS.brands,
      instagram:    data.instagram    ?? DEFAULT_SETTINGS.instagram,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

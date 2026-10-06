import { cache } from "react";
import { CATEGORIES, COUPONS, PRODUCTS } from "@/lib/data/seed";
import type { Category, Coupon, Product, ProductsPage } from "@/lib/types";
import { ApiError, apiFetch, isApiConfigured } from "@/lib/api/client";

/**
 * ⚠️ REGLA CLAVE DE ESTE ARCHIVO — no cachear fallas transitorias.
 *
 * Las páginas del sitio usan ISR (se cachean por un rato). Si ante un corte
 * de red devolvemos "no existe" (undefined) o "no hay nada" ([]), Next.js
 * cachea ESE resultado como si fuera la verdad: un producto real queda en
 * 404, o la tienda queda vacía, hasta que venza el caché (una hora).
 *
 * Pasó de verdad: durante unos cortes de conexión al backend, fichas de
 * producto válidas quedaron mostrando 404 y hubo que forzar la
 * revalidación de las 800+ páginas a mano.
 *
 * Por eso:
 *  - Un 404 REAL del backend sí significa "no existe" → devolvemos vacío.
 *  - Cualquier otra falla (timeout, red caída, 500) se RELANZA. Next.js no
 *    cachea una página que falló: sigue sirviendo la última versión buena y
 *    reintenta en el próximo pedido. Es preferible a congelar un dato falso.
 */
function isRealNotFound(e: unknown): boolean {
  return e instanceof ApiError && e.status === 404;
}

/**
 * Caché de datos de Next.js (Data Cache) para las llamadas públicas al
 * backend. Existe para NO golpear a Laravel/MySQL en cada render: el hosting
 * compartido rechaza conexiones cuando llegan muchas a la vez (error
 * `SQLSTATE[HY000] [2002]`), y cada render de /tienda o de una ficha disparaba
 * varias llamadas en paralelo con la misma respuesta.
 *
 *  - Next solo guarda respuestas 200: una falla NO queda cacheada (respeta la
 *    regla de arriba) y, si el backend cae, se sigue sirviendo la última copia
 *    buena hasta que se pueda revalidar.
 *  - `tags` permite invalidar al instante desde Laravel (POST /api/revalidate
 *    con `tags`). Los TTL son la red de seguridad si ese aviso falla.
 *  - OJO: un `revalidate` menor al de la ruta le BAJA el intervalo a toda la
 *    ruta. Las rutas ISR de este sitio usan 3600, así que lo que se llame
 *    desde ahí tiene que usar >= 3600. Solo /tienda (dinámica, por
 *    searchParams) puede usar un TTL corto.
 */
const CACHE_LONG = 3600;
const CACHE_SHOP = 300;
const TAG_CATEGORIES = "categories";
const TAG_PRODUCTS = "products";

/**
 * Capa de acceso al catálogo.
 *
 * Si el backend está activo (BACKEND_ENABLED + NEXT_PUBLIC_API_URL) consume la
 * API REST de Laravel. Si no, usa los mocks del dataset semilla. La firma de las
 * funciones no cambia, así que la UI (server components y React Query) es la misma.
 * Seguro de importar en server y cliente.
 */

export type ProductFilters = {
  category?: string;
  collection?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  search?: string;
  sort?: "relevancia" | "precio-asc" | "precio-desc" | "nuevos";
  /** Token de descuento por link único (?promo=...). */
  promo?: string;
  /** Solo productos marcados como "destacado" en el admin. */
  featured?: boolean;
  /**
   * Trae como máximo N productos (tope 100 en el backend). Para secciones
   * que muestran unos pocos: sin esto se descarga el catálogo completo y se
   * descarta el 98% en el front.
   */
  limit?: number;
};

function materialOf(p: Product): string[] {
  const fromVariants = p.variants
    .filter((v) => v.type === "material")
    .map((v) => v.value);
  if (fromVariants.length) return fromVariants;
  return p.specs?.material ? [p.specs.material] : [];
}

function toQuery(filters: ProductFilters): string {
  const p = new URLSearchParams();
  if (filters.category) p.set("categoria", filters.category);
  if (filters.collection) p.set("coleccion", filters.collection);
  if (filters.material) p.set("material", filters.material);
  if (typeof filters.minPrice === "number") p.set("min", String(filters.minPrice));
  if (typeof filters.maxPrice === "number") p.set("max", String(filters.maxPrice));
  if (filters.onSale) p.set("oferta", "1");
  if (filters.search) p.set("q", filters.search);
  if (filters.sort && filters.sort !== "relevancia") p.set("orden", filters.sort);
  if (filters.promo) p.set("promo", filters.promo);
  if (filters.featured) p.set("destacado", "1");
  if (typeof filters.limit === "number") p.set("limit", String(filters.limit));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

// ───────────────────────── Mocks (fallback) ─────────────────────────
function filterMock(filters: ProductFilters): Product[] {
  let list = [...PRODUCTS];
  if (filters.category) list = list.filter((p) => p.categorySlug === filters.category);
  if (filters.collection) list = list.filter((p) => p.collection === filters.collection);
  if (filters.material) {
    list = list.filter((p) =>
      materialOf(p).some((m) => m.toLowerCase().includes(filters.material!.toLowerCase())),
    );
  }
  if (typeof filters.minPrice === "number") list = list.filter((p) => p.price >= filters.minPrice!);
  if (typeof filters.maxPrice === "number") list = list.filter((p) => p.price <= filters.maxPrice!);
  if (filters.onSale) list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  if (filters.featured) list = list.filter((p) => p.badges.includes("destacado"));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.collection ?? "").toLowerCase().includes(q),
    );
  }
  switch (filters.sort) {
    case "precio-asc": list.sort((a, b) => a.price - b.price); break;
    case "precio-desc": list.sort((a, b) => b.price - a.price); break;
    case "nuevos": list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    default: list.sort((a, b) => b.rating - a.rating);
  }
  return typeof filters.limit === "number" ? list.slice(0, filters.limit) : list;
}

// ───────────────────────── Acceso público ─────────────────────────
// `cache()` de React: dentro de un mismo render (footer + página + header)
// se pide una sola vez. El `fetch` de apiFetch lleva `signal` (timeout), y con
// signal Next.js no deduplica por su cuenta.
export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isApiConfigured()) return CATEGORIES;
  // Sin catch: si la API falla, se relanza (ver regla del encabezado). Antes
  // devolvía [] y eso quedaba cacheado como "la tienda no tiene categorías".
  return await apiFetch<Category[]>("/categories", {
    next: { revalidate: CACHE_LONG, tags: [TAG_CATEGORIES] },
  });
});

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

/**
 * Filtra categorías sin productos cargados (existen en el admin, pero
 * todavía no tienen nada dentro) para no mostrarlas en navegación pública
 * (tabs del home, menú "Tienda", filtros, footer). `hasProducts` viene del
 * backend; si no viene (ej. mocks locales) se asume visible por compatibilidad.
 */
export function visibleCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.hasProducts !== false);
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (!isApiConfigured()) return filterMock(filters);
  // Sin catch: nunca cachear "la tienda está vacía" por un corte de red, y
  // nunca caer al catálogo de PRUEBA (seed.ts) en producción. Ver la regla
  // del encabezado del archivo.
  return await apiFetch<Product[]>(`/products${toQuery(filters)}`, {
    next: { revalidate: CACHE_LONG, tags: [TAG_PRODUCTS] },
  });
}

/**
 * Igual que getProducts() pero tolera fallas: se usa en secciones
 * secundarias/decorativas (relacionados, destacados, nuevos, ofertas). Que
 * falle una de esas no justifica tirar abajo una página que por lo demás
 * cargó bien — se muestran vacías y listo.
 */
async function getProductsSafe(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    return await getProducts(filters);
  } catch {
    return [];
  }
}

const DEFAULT_PER_PAGE = 24;

/**
 * Versión paginada de /tienda: pide una página del catálogo en vez de todo
 * de una (evita que la tienda se ponga lenta/se trabe con cientos de
 * productos). El resto de las secciones (destacados, home, relacionados,
 * etc.) siguen usando getProducts() sin paginar.
 */
export async function getProductsPaginated(
  filters: ProductFilters = {},
  page = 1,
  perPage = DEFAULT_PER_PAGE,
): Promise<ProductsPage> {
  if (!isApiConfigured()) {
    const all = filterMock(filters);
    const start = (page - 1) * perPage;
    return {
      items: all.slice(start, start + perPage),
      page,
      perPage,
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / perPage)),
    };
  }

  // Sin catch: una falla de red se propaga para que Next.js no cachee una
  // /tienda vacía. Ver la regla del encabezado del archivo.
  const qs = toQuery(filters);
  const sep = qs ? "&" : "?";
  const res = await apiFetch<{
    data: Product[];
    meta: { currentPage: number; lastPage: number; perPage: number; total: number };
  }>(`/products${qs}${sep}page=${page}&per_page=${perPage}`, {
    next: { revalidate: CACHE_SHOP, tags: [TAG_PRODUCTS] },
  });
  return {
    items: res.data,
    page: res.meta.currentPage,
    totalPages: res.meta.lastPage,
    total: res.meta.total,
    perPage: res.meta.perPage,
  };
}

// `cache()`: generateMetadata y la página piden el mismo producto en un render;
// así sale una sola llamada a la API.
export const getProductBySlug = cache(async (slug: string, promo?: string): Promise<Product | undefined> => {
  if (isApiConfigured()) {
    try {
      const qs = promo ? `?promo=${encodeURIComponent(promo)}` : "";
      return await apiFetch<Product>(`/products/${slug}${qs}`);
    } catch (e) {
      // Solo un 404 real del backend significa que el producto no existe.
      if (isRealNotFound(e)) return undefined;
      // Un corte de red NO es "producto inexistente": si devolviéramos
      // undefined acá, la página llamaría a notFound() y Next.js cachearía
      // ese 404 sobre un producto que sí existe. Ver la regla del encabezado.
      throw e;
    }
  }
  return PRODUCTS.find((p) => p.slug === slug);
});

export async function getProductById(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.id === id);
}

// ── Secciones secundarias: usan getProductsSafe() a propósito ──
// Son bloques decorativos ("también te puede gustar", destacados del home,
// filtros de material). Si el catálogo no responde se muestran vacías, pero
// no tiran abajo la ficha de producto o la tienda que ya cargó bien.

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  // Pide solo la categoría del producto (+1 por si viene él mismo en la
  // lista) en vez de descargar el catálogo entero para filtrar en el front.
  const sameCategory = await getProductsSafe({
    category: product.categorySlug,
    limit: limit + 1,
  });
  return sameCategory.filter((p) => p.id !== product.id).slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return await getProductsSafe({ featured: true, limit });
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return await getProductsSafe({ sort: "nuevos", limit });
}

export async function getOnSaleProducts(limit = 8): Promise<Product[]> {
  return await getProductsSafe({ onSale: true, limit });
}

/** Materiales disponibles para filtros (derivados del catálogo). */
export async function getMaterials(): Promise<string[]> {
  if (isApiConfigured()) {
    try {
      // Endpoint dedicado: antes esto descargaba el catálogo completo
      // (1.3 MB) en cada carga de /tienda sólo para juntar esta lista.
      return await apiFetch<string[]>("/products/materials", {
        next: { revalidate: CACHE_LONG, tags: [TAG_PRODUCTS] },
      });
    } catch {
      return [];
    }
  }
  const set = new Set<string>();
  PRODUCTS.forEach((p) => materialOf(p).forEach((m) => set.add(m)));
  return [...set].sort();
}

/** Cupones: validación rápida (mock). En backend usar POST /coupons/validate. */
export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}

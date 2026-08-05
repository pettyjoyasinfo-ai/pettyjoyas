import { CATEGORIES, COUPONS, PRODUCTS } from "@/lib/data/seed";
import type { Category, Coupon, Product } from "@/lib/types";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

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
  return list;
}

// ───────────────────────── Acceso público ─────────────────────────
export async function getCategories(): Promise<Category[]> {
  if (!isApiConfigured()) return CATEGORIES;
  try {
    return await apiFetch<Category[]>("/categories");
  } catch {
    return CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (!isApiConfigured()) return filterMock(filters);
  try {
    return await apiFetch<Product[]>(`/products${toQuery(filters)}`);
  } catch {
    return filterMock(filters);
  }
}

export async function getProductBySlug(slug: string, promo?: string): Promise<Product | undefined> {
  if (isApiConfigured()) {
    try {
      const qs = promo ? `?promo=${encodeURIComponent(promo)}` : "";
      return await apiFetch<Product>(`/products/${slug}${qs}`);
    } catch {
      return undefined;
    }
  }
  return PRODUCTS.find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.id === id);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProducts();
  return all
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug || p.collection === product.collection),
    )
    .slice(0, limit);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.badges.includes("destacado")).slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return (await getProducts({ sort: "nuevos" })).slice(0, limit);
}

export async function getOnSaleProducts(limit = 8): Promise<Product[]> {
  return (await getProducts({ onSale: true })).slice(0, limit);
}

/** Materiales disponibles para filtros (derivados del catálogo). */
export async function getMaterials(): Promise<string[]> {
  const all = await getProducts();
  const set = new Set<string>();
  all.forEach((p) => materialOf(p).forEach((m) => set.add(m)));
  return [...set].sort();
}

/** Cupones: validación rápida (mock). En backend usar POST /coupons/validate. */
export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}

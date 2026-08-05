import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Tag, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts } from "@/lib/data/products";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";

type PromoInfo = {
  id: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  scope: "all" | "category" | "products";
  categoryName?: string | null;
  categorySlug?: string | null;
  productIds?: number[];
  endsAt?: string | null;
  live: boolean;
  token: string;
};

async function getPromo(token: string): Promise<PromoInfo | null> {
  if (!isApiConfigured()) return null;
  try {
    return await apiFetch<PromoInfo>(`/promo/${token}`);
  } catch {
    return null;
  }
}

function formatDiscount(promo: PromoInfo): string {
  return promo.type === "percent"
    ? `${promo.value}% OFF`
    : `${formatPrice(promo.value)} de descuento`;
}

function scopeLabel(promo: PromoInfo): string {
  if (promo.scope === "category" && promo.categoryName) {
    return `en ${promo.categoryName}`;
  }
  if (promo.scope === "products") {
    return "en productos seleccionados";
  }
  return "en toda la tienda";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const promo = await getPromo(token);
  if (!promo) return { title: "Oferta exclusiva" };
  return {
    title: promo.name,
    description: `${formatDiscount(promo)} ${scopeLabel(promo)} — Petty Joyas`,
  };
}

export default async function PromoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const promo = await getPromo(token);

  if (!promo) notFound();
  if (!promo.live) {
    return <PromoExpired name={promo.name} />;
  }

  // Fetch the products that apply to this promo
  const productFilters =
    promo.scope === "category" && promo.categorySlug
      ? { category: promo.categorySlug, promo: token }
      : { promo: token };

  const allProducts = await getProducts(productFilters);

  // For scope:products, filter client-side to only show promo products
  const products =
    promo.scope === "products" && promo.productIds?.length
      ? allProducts.filter((p) => promo.productIds!.includes(Number(p.id)))
      : allProducts;

  const discount = formatDiscount(promo);

  return (
    <div className="min-h-screen">
      {/* Hero de la promo */}
      <div className="bg-gradient-to-br from-[#8B1A2E] to-[#6B1422] py-16 text-white">
        <div className="container-px text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            Oferta exclusiva
          </div>

          <h1 className="mt-5 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            {discount}
          </h1>
          <p className="mt-3 text-xl font-medium text-white/80">{promo.name}</p>
          <p className="mt-2 text-base text-white/60">{scopeLabel(promo)}</p>

          {promo.endsAt && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
              <Clock className="h-4 w-4" />
              Válido hasta el{" "}
              {new Date(promo.endsAt).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/tienda?promo=${token}${promo.scope === "category" && promo.categorySlug ? `&categoria=${promo.categorySlug}` : ""}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#8B1A2E] shadow-lg transition hover:bg-white/90"
            >
              <ShoppingBag className="h-4 w-4" />
              Comprar ahora
            </Link>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              Ver toda la tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Banda de confianza */}
      <div className="border-b border-line bg-stone-bg">
        <div className="container-px flex flex-wrap items-center justify-center gap-6 py-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-brand" /> Descuento aplicado automáticamente
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-brand" /> Sin código, sin vueltas
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" /> Más de 30 años de trayectoria
          </span>
        </div>
      </div>

      {/* Productos */}
      <div className="container-px py-12">
        {products.length > 0 ? (
          <>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">
                  {promo.scope === "products"
                    ? "Productos incluidos"
                    : promo.scope === "category" && promo.categoryName
                      ? `Toda la colección · ${promo.categoryName}`
                      : "Toda la colección"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {products.length} {products.length === 1 ? "producto" : "productos"} con{" "}
                  <span className="font-semibold text-brand">{discount}</span>
                </p>
              </div>
              <Link
                href={`/tienda?promo=${token}`}
                className="hidden items-center gap-1.5 text-sm font-medium text-brand hover:underline sm:flex"
              >
                Ver en tienda <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ProductGrid products={products} />
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-body">No hay productos disponibles en este momento.</p>
            <Link href="/tienda" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
              Ver toda la tienda →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function PromoExpired({ name }: { name: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-stone-bg">
        <Clock className="h-8 w-8 text-muted" />
      </div>
      <h1 className="font-display text-3xl text-ink">Esta promo ya expiró</h1>
      <p className="max-w-sm text-sm text-muted">
        <span className="font-medium text-ink">{name}</span> ya no está activa, pero tenemos
        muchas otras joyas esperándote en la tienda.
      </p>
      <Link
        href="/tienda"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
      >
        Ver toda la tienda <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

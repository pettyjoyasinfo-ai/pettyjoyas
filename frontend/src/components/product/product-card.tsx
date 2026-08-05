"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/ui/price";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/store";
import { useFavoriteIds, useToggleFavorite } from "@/lib/api/account";
import { usePublicSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const wished = favIds.includes(product.id);
  const { data: publicSettings } = usePublicSettings();
  const badgeCfg = publicSettings?.badges ?? DEFAULT_SETTINGS.badges;

  function toggleWish() {
    if (!user) {
      router.push("/cuenta?next=/favoritos");
      return;
    }
    toggleFav.mutate(product.id);
  }
  const hasVariants = product.variants.length > 0;
  const soldOut = product.stock <= 0;
  const cover = product.images[0];
  const hover = product.images[1] ?? product.images[0];

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: cover,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      maxStock: product.stock,
    });
  }

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-bg">
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {badgeCfg.destacado && product.badges.includes("destacado") && !product.badges.includes("oferta") && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
              Destacado
            </span>
          )}
          {badgeCfg.oferta && (product.badges.includes("oferta") || (product.compareAtPrice && product.compareAtPrice > product.price)) && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              {product.discountName ?? "Oferta"}
            </span>
          )}
          {badgeCfg.nuevo && product.badges.includes("nuevo") && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Nuevo
            </span>
          )}
          {badgeCfg.agotado && (soldOut || product.badges.includes("agotado")) && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Agotado
            </span>
          )}
        </div>

        <Link href={`/producto/${product.slug}`} className="block h-full w-full">
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          <Image
            src={hover}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Link>

        {/* Acciones verticales (estilo plantilla) */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label="Agregar al carrito"
            className="grid h-9 w-9 translate-x-12 place-items-center rounded-full bg-white text-ink shadow-md transition-all duration-300 hover:bg-brand hover:text-white group-hover:translate-x-0 disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
          <Link
            href={`/producto/${product.slug}`}
            aria-label="Ver producto"
            className="grid h-9 w-9 translate-x-12 place-items-center rounded-full bg-white text-ink shadow-md transition-all delay-75 duration-300 hover:bg-brand hover:text-white group-hover:translate-x-0"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={toggleWish}
            aria-label="Favorito"
            className="grid h-9 w-9 translate-x-12 place-items-center rounded-full bg-white text-ink shadow-md transition-all delay-150 duration-300 hover:bg-brand hover:text-white group-hover:translate-x-0"
          >
            <Heart className={cn("h-4 w-4", wished && "fill-brand text-brand")} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3.5 flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
          {product.categoryName}
        </span>
        <Link
          href={`/producto/${product.slug}`}
          className="font-display text-lg leading-snug text-ink transition hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          {!hasVariants && !soldOut && (
            <button
              type="button"
              onClick={handleAdd}
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:bg-brand hover:text-white sm:inline-flex"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

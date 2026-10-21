"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Eye, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/ui/price";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/store";
import { useFavoriteIds, useToggleFavorite } from "@/lib/api/account";
import { usePublicSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";

/** "Talle 16" -> "16": en la tarjeta alcanza con el número. */
function sizeText(v: ProductVariant) {
  return v.label.replace(/^talle\s*/i, "").trim() || v.label;
}

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
  // Compra rápida: solo si TODAS las variantes son talles (anillos, alianzas…). Si el
  // producto además pide elegir material, color, etc., hay que entrar a la ficha.
  const quickSizes = hasVariants && product.variants.every((v) => v.type === "talle");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const picked = quickSizes ? product.variants.find((v) => v.id === pickedId) ?? null : null;
  const cover = product.images[0];
  const hover = product.images[1] ?? product.images[0];

  function handleAddPicked() {
    if (!picked || picked.stock <= 0) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: picked.imageUrl ?? cover,
      price: product.price + (picked.priceDelta ?? 0),
      compareAtPrice: product.compareAtPrice,
      variantId: picked.id,
      variantLabel: picked.label,
      maxStock: picked.stock,
    });
    setJustAdded(true);
    setPickedId(null);
    setTimeout(() => setJustAdded(false), 1800);
  }

  function handleAdd() {
    // Con variantes no se puede agregar "a ciegas": se elige el talle acá o en la ficha.
    if (hasVariants) {
      if (picked) handleAddPicked();
      else router.push(`/producto/${product.slug}`);
      return;
    }
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

        <Link href={`/producto/${product.slug}`} prefetch={false} className="block h-full w-full">
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
            prefetch={false}
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
          prefetch={false}
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

        {quickSizes && !soldOut && (
          <div className="mt-1 flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Talle</p>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((v) => {
                const out = v.stock <= 0;
                const active = pickedId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={out}
                    aria-pressed={active}
                    aria-label={out ? `Talle ${sizeText(v)} sin stock` : `Talle ${sizeText(v)}`}
                    onClick={() => setPickedId(active ? null : v.id)}
                    className={cn(
                      "min-w-8 rounded-full border px-2 py-1 text-xs transition",
                      active ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand",
                      out && "cursor-not-allowed opacity-40 line-through hover:border-line",
                    )}
                  >
                    {sizeText(v)}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleAddPicked}
              disabled={!picked}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed",
                justAdded
                  ? "border-green-600 bg-green-600 text-white"
                  : picked
                    ? "border-brand bg-brand text-white hover:opacity-90"
                    : "border-line text-muted",
              )}
            >
              {justAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              {justAdded ? "Agregado" : picked ? `Agregar talle ${sizeText(picked)}` : "Elegí un talle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

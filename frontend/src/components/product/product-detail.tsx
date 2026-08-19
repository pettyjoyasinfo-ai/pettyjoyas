"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Heart,
  Minus,
  MessageCircle,
  Plus,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Price } from "@/components/ui/price";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/store";
import { useFavoriteIds, useToggleFavorite } from "@/lib/api/account";
import { useProductStock } from "@/lib/api/stock";
import { trackViewContent } from "@/lib/analytics/meta-pixel";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";

export function ProductDetail({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);

  // Evento estándar de Meta: alguien vio esta ficha de producto.
  useEffect(() => {
    trackViewContent({ id: product.id, name: product.name, price: product.price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const cartItems = useCart((s) => s.items);
  const router = useRouter();
  const authUser = useAuth((s) => s.user);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const wished = favIds.includes(product.id);

  // Stock en vivo (polling al backend). Cae al valor inicial del SSR si aún no llegó.
  const { data: live } = useProductStock(product.id);
  const liveTotal = live?.stock ?? product.stock;
  function variantStock(v: ProductVariant) {
    return live?.by_variant?.[v.id] ?? v.stock;
  }

  function toggleWish() {
    if (!authUser) {
      router.push("/cuenta?next=/favoritos");
      return;
    }
    toggleFav.mutate(product.id);
  }

  const variantGroups = useMemo(() => {
    const groups = new Map<string, ProductVariant[]>();
    for (const v of product.variants) {
      const arr = groups.get(v.type) ?? [];
      arr.push(v);
      groups.set(v.type, arr);
    }
    return groups;
  }, [product.variants]);

  const [activeImage, setActiveImage] = useState(0);
  const [selected, setSelected] = useState<ProductVariant | null>(
    product.variants.length === 0 ? null : null,
  );
  // Imagen que aporta la variante elegida (tiene prioridad sobre la galería).
  const [variantImg, setVariantImg] = useState<string | null>(null);
  // Se activa si el cliente intenta agregar al carrito sin elegir variante.
  const [variantError, setVariantError] = useState(false);

  function selectVariant(v: ProductVariant) {
    setSelected(v);
    setVariantImg(v.imageUrl ?? null);
    setVariantError(false);
  }

  const mainImage = variantImg ?? product.images[activeImage] ?? product.images[0];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const needsVariant = product.variants.length > 0;
  const unitPrice = product.price + (selected?.priceDelta ?? 0);
  const maxStock = needsVariant ? (selected ? variantStock(selected) : 0) : liveTotal;

  // Subtract what's already in the cart so the display reflects truly available units.
  const cartKey = selected ? `${product.id}::${selected.id}` : String(product.id);
  const cartQty = cartItems.find((it) => it.key === cartKey)?.quantity ?? 0;
  const remaining = Math.max(0, maxStock - cartQty);

  // Clamp qty selector when remaining drops (e.g. after adding to cart).
  useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, remaining)));
  }, [remaining]);

  const noSelection = needsVariant && !selected;
  const canAdd = !noSelection && remaining > 0;

  const typeLabels: Record<string, string> = {
    material: "Material",
    talle: "Talle",
    largo: "Largo",
    color: "Color / Variante",
    piedra: "Piedra",
  };

  function handleAddClick() {
    if (noSelection) {
      setVariantError(true);
      return;
    }
    handleAdd();
  }

  function handleAdd() {
    if (!canAdd) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: unitPrice,
      compareAtPrice: product.compareAtPrice,
      quantity: qty,
      variantId: selected?.id,
      variantLabel: selected?.label,
      maxStock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      {/* Galería */}
      <div className="flex flex-col-reverse gap-4 md:flex-row">
        <div className="flex gap-3 md:flex-col">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveImage(i);
                setVariantImg(null);
              }}
              className={cn(
                "relative h-20 w-16 overflow-hidden rounded-xl bg-stone-bg transition",
                !variantImg && activeImage === i ? "ring-2 ring-brand" : "ring-1 ring-line",
              )}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-stone-bg">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.16em] text-muted">
          {product.categoryName}
          {product.collection && ` · Colección ${product.collection}`}
        </span>
        <h1 className="mt-2 font-display text-4xl text-ink">{product.name}</h1>
        <div className="mt-5">
          <Price price={unitPrice} compareAtPrice={product.compareAtPrice} size="lg" />
          <p className="mt-1 text-xs text-muted">Precio final, incluye IVA (21%)</p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-body">
          {product.shortDescription}
        </p>

        {/* Variantes */}
        {variantGroups.size > 0 && (
          <div
            className={cn(
              "transition",
              variantError && noSelection && "-mx-3 mt-4 rounded-2xl border-2 border-red-400 bg-red-50/60 p-3",
            )}
          >
            {variantError && noSelection && (
              <p className="mb-3 text-sm font-semibold text-red-600">
                ⚠️ Elegí una opción antes de agregar al carrito.
              </p>
            )}
            {[...variantGroups.entries()].map(([type, variants]) => (
              <div key={type} className="mt-6 first:mt-0">
                <p className="mb-2 text-sm font-medium text-ink">
                  {typeLabels[type] ?? "Opción"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isActive = selected?.id === v.id;
                    const out = variantStock(v) <= 0;
                    return (
                      <button
                        key={v.id}
                        disabled={out}
                        onClick={() => selectVariant(v)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition",
                          isActive
                            ? "border-brand bg-brand text-white"
                            : "border-line text-ink hover:border-brand",
                          out && "cursor-not-allowed opacity-40 line-through",
                        )}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Peso de la variante elegida (si aplica) */}
        {selected?.weight != null && (
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-stone-bg px-3 py-1.5 text-xs font-medium text-ink">
            <Scale className="h-3.5 w-3.5 text-brand" />
            Peso: {selected.weight} g
          </div>
        )}

        {/* Stock (en vivo) */}
        <p className="mt-5 flex items-center gap-2 text-sm">
          {needsVariant && !selected ? (
            <span className={cn("font-medium", variantError ? "text-red-600" : "text-muted font-normal")}>
              Elegí una opción para ver disponibilidad.
            </span>
          ) : remaining > 0 ? (
            <span className="flex items-center gap-2 font-medium text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {remaining <= 5
                ? `¡Solo quedan ${remaining} disponible${remaining === 1 ? "" : "s"}!`
                : `${remaining} disponibles`}
            </span>
          ) : (
            <span className="font-medium text-brand">Sin stock</span>
          )}
        </p>

        {/* Cantidad + agregar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-line">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-12 w-12 place-items-center text-ink hover:text-brand"
              aria-label="Restar"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(remaining || 1, q + 1))}
              disabled={qty >= remaining}
              className="grid h-12 w-12 place-items-center text-ink hover:text-brand disabled:opacity-40"
              aria-label="Sumar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleAddClick}
            disabled={!noSelection && remaining <= 0}
            className={cn("btn-brand flex-1", !canAdd && "opacity-50")}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Agregado
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Agregar al carrito
              </>
            )}
          </button>

          <button
            onClick={toggleWish}
            aria-label="Favorito"
            className="grid h-12 w-12 place-items-center rounded-full border border-line text-ink transition hover:border-brand hover:text-brand"
          >
            <Heart className={cn("h-5 w-5", wished && "fill-brand text-brand")} />
          </button>
        </div>

        {/* WhatsApp */}
        {product.whatsappUrl && (
          <a
            href={product.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border border-[#25D366] py-3 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Consultar por WhatsApp
          </a>
        )}

        {/* Garantías */}
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-stone-bg p-5 sm:grid-cols-2">
          <span className="flex items-center gap-2.5 text-sm text-body">
            <Truck className="h-5 w-5 text-brand" /> Envío a todo el país
          </span>
          <span className="flex items-center gap-2.5 text-sm text-body">
            <ShieldCheck className="h-5 w-5 text-brand" /> Garantía de por vida
          </span>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="font-display text-2xl text-ink">Descripción</h2>
          <p className="mt-3 text-sm leading-relaxed text-body">{product.description}</p>
        </div>
      </div>
    </div>
  );
}

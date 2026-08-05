"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useCart } from "@/lib/cart/store";
import { computeTotals } from "@/lib/cart/totals";
import { itemNotice } from "@/lib/cart/validation";
import { findCoupon } from "@/lib/data/products";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";
import type { Coupon } from "@/lib/types";

export default function CartPage() {
  const { items, setQuantity, removeItem, revalidate, hasBlockingIssues } = useCart();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Revalida stock/precio/disponibilidad al abrir el carrito.
  useEffect(() => {
    revalidate();
  }, [revalidate]);

  const totals = computeTotals(items, { coupon });

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Backend real: valida contra /coupons/validate.
    if (isApiConfigured()) {
      try {
        const res = await apiFetch<{ valid: boolean; coupon: Coupon }>("/coupons/validate", {
          method: "POST",
          body: JSON.stringify({ code, subtotal: totals.subtotal }),
        });
        setCoupon(res.coupon);
        setCode("");
      } catch (err: any) {
        setError(err?.details?.message ?? "Cupón inválido o no aplicable.");
      }
      return;
    }

    // Modo mock.
    const found = findCoupon(code);
    if (!found) return setError("Cupón inválido.");
    if (found.minSubtotal && totals.subtotal < found.minSubtotal) {
      return setError(`Requiere un mínimo de ${formatPrice(found.minSubtotal)}.`);
    }
    setCoupon(found);
    setCode("");
  }

  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Carrito" }]} />
      <h1 className="mt-6 mb-8 font-display text-4xl text-ink">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-line py-24 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-stone-bg">
            <ShoppingBag className="h-8 w-8 text-muted" />
          </div>
          <p className="text-body">Todavía no agregaste productos.</p>
          <Link href="/tienda" className="btn-brand">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* Items */}
          <div>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-bg"
                  >
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/producto/${item.slug}`}
                          className="font-display text-lg text-ink hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel && (
                          <p className="text-xs text-muted">{item.variantLabel}</p>
                        )}
                        {(() => {
                          const notice = itemNotice(item);
                          return notice ? (
                            <p
                              className={cn(
                                "mt-1 flex items-center gap-1 text-xs font-medium",
                                notice.tone === "danger" ? "text-red-600" : "text-amber-600",
                              )}
                            >
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {notice.text}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="text-muted transition hover:text-brand"
                        aria-label="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          className="grid h-9 w-9 place-items-center text-ink hover:text-brand"
                          aria-label="Restar"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="grid h-9 w-9 place-items-center text-ink hover:text-brand disabled:opacity-40"
                          aria-label="Sumar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/tienda"
              className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
            >
              ← Seguir comprando
            </Link>
          </div>

          {/* Resumen */}
          <aside className="h-fit rounded-2xl border border-line p-6 lg:sticky lg:top-28">
            <h2 className="mb-4 text-lg font-semibold text-ink">Resumen</h2>

            {/* Cupón */}
            {coupon ? (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-brand-700">
                  <Tag className="h-4 w-4" /> {coupon.code}
                </span>
                <button
                  onClick={() => setCoupon(null)}
                  className="text-brand-700"
                  aria-label="Quitar cupón"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="mb-4">
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Código de cupón"
                    className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                  <button type="submit" className="btn-outline px-5 py-2.5">
                    Aplicar
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-brand">{error}</p>}
                <p className="mt-2 text-xs text-muted">Probá: BIENVENIDA10</p>
              </form>
            )}

            <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-body">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Descuento</dt>
                  <dd>-{formatPrice(totals.discount)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-base font-semibold text-ink">Total</span>
              <span className="text-2xl font-semibold text-ink">
                {formatPrice(totals.total)}
              </span>
            </div>

            {hasBlockingIssues && (
              <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Quitá los productos sin stock para continuar.
              </p>
            )}
            {hasBlockingIssues ? (
              <span className="btn-brand pointer-events-none mt-6 w-full opacity-50">
                Finalizar compra
              </span>
            ) : (
              <Link href="/checkout" className="btn-brand mt-6 w-full">
                Finalizar compra
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

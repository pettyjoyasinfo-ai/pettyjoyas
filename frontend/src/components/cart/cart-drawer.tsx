"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { computeTotals } from "@/lib/cart/totals";
import { usePublicSettings } from "@/lib/api/admin";
import { SITE } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";
import { itemNotice } from "@/lib/cart/validation";
import type { CartItem } from "@/lib/types";

/** Muestra el tiempo restante de la reserva más próxima a expirar. */
function ReservationTimer({ items, onExpired }: { items: CartItem[]; onExpired: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  // Primitivo numérico — React lo compara por valor, no por referencia,
  // así el effect no se re-ejecuta solo porque `items` es un nuevo array.
  const expiries = items
    .map((it) => it.reservedUntil)
    .filter(Boolean)
    .map((s) => new Date(s!).getTime());
  const earliestExpiry = expiries.length ? Math.min(...expiries) : null;

  useEffect(() => {
    if (earliestExpiry === null) {
      setSecondsLeft(null);
      return;
    }

    let fired = false;
    const id = setInterval(() => {
      const diff = Math.floor((earliestExpiry - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsLeft(0);
        if (!fired) {
          fired = true;
          clearInterval(id); // para el interval antes de llamar onExpired
          onExpiredRef.current();
        }
      } else {
        setSecondsLeft(diff);
      }
    }, 1000);

    // Llamada inicial para mostrar el valor de inmediato
    const initDiff = Math.floor((earliestExpiry - Date.now()) / 1000);
    setSecondsLeft(initDiff > 0 ? initDiff : 0);

    return () => clearInterval(id);
  }, [earliestExpiry]); // número primitivo: estable entre renders si el valor no cambia

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const label = `${mins}:${String(secs).padStart(2, "0")}`;
  const urgent = secondsLeft < 60;
  const warning = secondsLeft < 300;

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-5 py-3 text-xs font-medium",
        urgent
          ? "border-red-200 bg-red-50 text-red-700"
          : warning
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-line bg-stone-bg text-body",
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {urgent ? (
        <span>⚡ ¡Tu reserva expira en {label}! Completá la compra ahora.</span>
      ) : warning ? (
        <span>Tu reserva de stock vence en {label}. Finalizá pronto.</span>
      ) : (
        <span>Stock reservado por {label} min.</span>
      )}
    </div>
  );
}

export function CartDrawer() {
  const { isOpen, close, items, setQuantity, removeItem, revalidate, expireReservations, hasBlockingIssues } = useCart();
  const [reservationExpired, setReservationExpired] = useState(false);
  // Opciones de envío reales de /admin/configuracion (ver checkout/page.tsx).
  const { data: publicSettings } = usePublicSettings();
  const shippingSetting = publicSettings?.shipping;
  const shippingRates = shippingSetting
    ? {
        flatRate: Math.round(shippingSetting.costo_estandar / 100),
        freeThreshold: Math.round(shippingSetting.gratis_desde / 100),
      }
    : SITE.shipping;
  const totals = computeTotals(items, { shippingRates });

  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;
  const expireRef = useRef(expireReservations);
  expireRef.current = expireReservations;

  // Al abrir el carrito, revalida stock/precio/disponibilidad contra el catálogo.
  // Usamos ref para que el effect no se re-ejecute si revalidate cambia de referencia.
  useEffect(() => {
    if (isOpen) {
      setReservationExpired(false);
      revalidateRef.current();
    }
  }, [isOpen]);

  async function handleReservationExpired() {
    await expireRef.current();
    setReservationExpired(true);
  }

  // Items con reserva activa (vencimiento en el futuro; solo usuarios logueados).
  const reservedItems = items.filter(
    (it) => !!it.reservedUntil && new Date(it.reservedUntil).getTime() > Date.now(),
  );
  const progress = Math.min(
    100,
    Math.round((totals.subtotal / SITE.shipping.freeThreshold) * 100),
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ShoppingBag className="h-5 w-5" /> Tu carrito ({totals.itemCount})
          </h2>
          <button onClick={close} aria-label="Cerrar carrito">
            <X className="h-6 w-6 text-ink" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-stone-bg">
              <ShoppingBag className="h-8 w-8 text-muted" />
            </div>
            <p className="text-body">Tu carrito está vacío.</p>
            <button onClick={close} className="btn-outline">
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            {/* Aviso de reserva expirada */}
            {reservationExpired && (
              <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Tu reserva de stock expiró. Las unidades fueron liberadas, pero tus ítems siguen en el carrito. El stock disponible puede haber cambiado.
                </span>
              </div>
            )}

            {/* Countdown de reserva de stock (solo con el carrito abierto) */}
            {isOpen && !reservationExpired && reservedItems.length > 0 && (
              <ReservationTimer items={reservedItems} onExpired={handleReservationExpired} />
            )}

            {/* Envío gratis */}
            <div className="border-b border-line px-5 py-4">
              {totals.freeShipping ? (
                <p className="text-sm font-medium text-green-700">
                  🎉 ¡Tenés envío gratis!
                </p>
              ) : (
                <p className="text-sm text-body">
                  Te faltan{" "}
                  <span className="font-semibold text-ink">
                    {formatPrice(totals.remainingForFreeShipping)}
                  </span>{" "}
                  para el envío gratis
                </p>
              )}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-bg">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-bg">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link
                        href={`/producto/${item.slug}`}
                        onClick={close}
                        className="font-display text-base leading-snug text-ink hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      {item.variantLabel && (
                        <span className="text-xs text-muted">{item.variantLabel}</span>
                      )}
                      <span className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-ink">
                        {formatPrice(item.price)}
                        {item.status === "price_changed" && item.previousPrice && (
                          <span className="text-xs font-normal text-muted line-through">
                            {formatPrice(item.previousPrice)}
                          </span>
                        )}
                      </span>
                      {(() => {
                        const notice = itemNotice(item);
                        return notice ? (
                          <span
                            className={cn(
                              "mt-1 flex items-center gap-1 text-[11px] font-medium",
                              notice.tone === "danger" ? "text-red-600" : "text-amber-600",
                            )}
                          >
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {notice.text}
                          </span>
                        ) : null;
                      })()}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            onClick={() => setQuantity(item.key, item.quantity - 1)}
                            className="grid h-8 w-8 place-items-center text-ink hover:text-brand"
                            aria-label="Restar"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => setQuantity(item.key, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="grid h-8 w-8 place-items-center text-ink hover:text-brand disabled:opacity-40"
                            aria-label="Sumar"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-muted transition hover:text-brand"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-body">Subtotal</span>
                <span className="text-lg font-semibold text-ink">
                  {formatPrice(totals.subtotal)}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted">
                Envío e impuestos calculados en el checkout.
              </p>
              {hasBlockingIssues && (
                <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Quitá los productos sin stock para poder continuar.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {hasBlockingIssues ? (
                  <span className="btn-brand pointer-events-none w-full opacity-50">
                    Finalizar compra
                  </span>
                ) : (
                  <Link href="/checkout" onClick={close} className="btn-brand w-full">
                    Finalizar compra
                  </Link>
                )}
                <Link href="/carrito" onClick={close} className="btn-outline w-full">
                  Ver carrito
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

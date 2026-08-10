"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CreditCard, Landmark, Lock, MessageCircle, Store, Tag, Truck, X } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/store";
import { computeTotals } from "@/lib/cart/totals";
import { isApiConfigured, apiFetch } from "@/lib/api/client";
import { usePublicSettings } from "@/lib/api/admin";
import { SITE } from "@/lib/site";
import { Spinner } from "@/components/ui/spinner";
import { trackInitiateCheckout } from "@/lib/analytics/meta-pixel";
import { cn, formatPrice } from "@/lib/utils";
import type { Coupon, PaymentMethod, ShippingMethod } from "@/lib/types";

type TransferInfo = {
  type: "transferencia";
  alias: string;
  cbu: string;
  bank: string;
  holder: string;
  whatsapp: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, revalidate, hasBlockingIssues } = useCart();
  const user = useAuth((s) => s.user);
  const authHydrated = useAuth((s) => s.hydrated);

  const [shipping, setShipping] = useState<ShippingMethod>("envio");
  const [payment, setPayment] = useState<PaymentMethod>("mercadopago");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);

  // Checkout disponible con o sin sesión (compra como invitado: pide email).
  useEffect(() => {
    revalidate();
  }, [revalidate]);

  // Si volvemos de MercadoPago sin haber completado el pago (canceló, cerró
  // la pestaña, tarjeta rechazada), el carrito sigue intacto — no se vació
  // antes de redirigir, así que el cliente puede reintentar sin perder nada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_failed")) {
      setError("El pago no se completó. Tu carrito sigue guardado — podés intentar de nuevo.");
      sessionStorage.removeItem("petty-pending-order");
      window.history.replaceState(null, "", "/checkout");
    }
  }, []);

  // Al redirigir a MercadoPago con window.location.href nunca se vuelve a
  // poner submitting en false (se espera que la página se abandone del
  // todo). Pero al volver con el botón "atrás" del navegador, Chrome/Safari
  // suelen restaurar esta misma página desde bfcache en vez de recargarla
  // de cero — el "Procesando…" queda congelado para siempre y el botón no
  // vuelve a responder. pageshow con persisted=true detecta justo ese caso.
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setSubmitting(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Pre-carga los datos de transferencia para no bloquear al seleccionar el método.
  useEffect(() => {
    if (isApiConfigured()) {
      apiFetch<TransferInfo>("/payments/transfer-info").then(setTransferInfo).catch(() => null);
    }
  }, []);

  // Opciones de envío y descuento por transferencia reales de
  // /admin/configuracion (guardadas en centavos, ver SalesService en el
  // backend); si todavía no cargaron, caen a los defaults de SITE.shipping.
  const { data: publicSettings } = usePublicSettings();
  const shippingSetting = publicSettings?.shipping;
  const shippingRates = shippingSetting
    ? {
        flatRate: Math.round(shippingSetting.costo_estandar / 100),
        freeThreshold: Math.round(shippingSetting.gratis_desde / 100),
      }
    : SITE.shipping;
  const transferDiscountPct: number = publicSettings?.payment?.descuento_transferencia ?? 10;

  const totals = computeTotals(items, {
    coupon,
    shippingMethod: shipping,
    paymentMethod: payment,
    transferDiscountPct,
    shippingRates,
  });

  // Evento estándar de Meta: alguien llegó al checkout con el carrito armado.
  // Una sola vez por visita a la página (no en cada re-render al tipear o
  // cambiar el método de envío/pago).
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      items: items.map((it) => ({ id: it.productId, quantity: it.quantity })),
      value: totals.total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const [firstName, ...rest] = (user?.name ?? "").trim().split(" ");
  const lastName = rest.join(" ");

  if (isApiConfigured() && !authHydrated) {
    return (
      <div className="container-px flex justify-center py-28">
        <Spinner className="text-brand" />
      </div>
    );
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const data = await apiFetch<any>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, subtotal: totals.subtotal }),
      });
      if (data.valid) {
        setCouponApplied(couponCode.toUpperCase());
        // El objeto real (type/value) es lo que computeTotals() necesita
        // para calcular el descuento — antes se armaba uno falso acá mismo
        // y el descuento mostrado siempre terminaba en $0.
        setCoupon(data.coupon ?? null);
        setCouponCode("");
      } else {
        setCouponError(data.message ?? "Cupón inválido");
      }
    } catch {
      setCouponError("Cupón inválido o no disponible");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasBlockingIssues) return;
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const body = {
      payment_method: payment,
      shipping_method: shipping,
      coupon_code: couponApplied ?? undefined,
      customer: {
        name: `${form.get("firstName")} ${form.get("lastName")}`.trim(),
        email: form.get("email") as string,
        phone: form.get("phone") as string,
      },
      items: items.map((it) => ({
        product_id: parseInt(it.productId),
        product_variant_id: it.variantId ? parseInt(it.variantId) : undefined,
        quantity: it.quantity,
      })),
      ...(shipping === "envio"
        ? {
            address: {
              street: form.get("street"),
              number: form.get("number"),
              apartment: form.get("apartment"),
              city: form.get("city"),
              province: form.get("province"),
              zip: form.get("zip"),
            },
          }
        : {}),
      notes: form.get("notes") as string | null,
    };

    try {
      const data = await apiFetch<{ order: any; payment: any }>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.payment?.type === "mercadopago" && data.payment?.init_point) {
        // OJO: NO vaciar el carrito acá — todavía no sabemos si el pago se
        // concreta. Si el cliente cancela o cierra MercadoPago sin pagar,
        // vuelve a /checkout?payment_failed=1 con el carrito intacto. Recién
        // se limpia en /pedido-confirmado, una vez confirmado el pago real.
        sessionStorage.setItem(
          "petty-pending-order",
          JSON.stringify({ number: data.order.number, email: body.customer.email }),
        );
        window.location.href = data.payment.init_point;
        return;
      }

      // Transfer o efectivo: la orden ya queda registrada (pendiente de
      // confirmación manual o retiro), así que acá sí se vacía el carrito.
      const receiptItems = items.map((it) => ({
        productId: it.productId,
        name: it.name,
        variantLabel: it.variantLabel || null,
        unitPrice: it.price,
        quantity: it.quantity,
      }));
      clear();
      sessionStorage.setItem(
        "petty-last-order",
        JSON.stringify({
          number: data.order.number,
          total: data.order.total,
          payment: payment,
          customer: { email: body.customer.email },
          items: receiptItems,
          transferInfo: data.payment ?? null,
        }),
      );
      router.push("/pedido-confirmado");
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error al procesar el pedido. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-px flex flex-col items-center gap-5 py-28 text-center">
        <h1 className="font-display text-4xl text-ink">Tu carrito está vacío</h1>
        <p className="text-body">Agregá productos antes de finalizar la compra.</p>
        <Link href="/tienda" className="btn-brand">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="container-px py-8">
      <h1 className="mb-8 font-display text-4xl text-ink">Finalizar compra</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-8">
          {/* Datos del comprador */}
          <Section step={1} title="Tus datos">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field name="firstName" label="Nombre" required defaultValue={firstName} />
              <Field name="lastName" label="Apellido" required defaultValue={lastName} />
              <Field name="email" label="Email" type="email" required defaultValue={user?.email} />
              <Field name="phone" label="Teléfono / WhatsApp" required defaultValue={user?.phone ?? ""} />
            </div>
            {user ? (
              <p className="mt-3 text-xs text-muted">
                Comprás como <span className="font-medium text-ink">{user.email}</span>.
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Comprás como invitado.{" "}
                <Link href="/cuenta?next=/checkout" className="font-medium text-brand underline-offset-2 hover:underline">
                  Iniciá sesión
                </Link>{" "}
                para ver tu historial de pedidos. Si más adelante te registrás con este mismo email, este
                pedido va a quedar vinculado solo a tu cuenta.
              </p>
            )}
          </Section>

          {/* Entrega */}
          <Section step={2} title="Entrega">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OptionCard
                active={shipping === "envio"}
                onClick={() => setShipping("envio")}
                icon={<Truck className="h-5 w-5" />}
                title="Envío a domicilio"
                desc="Llega en 3 a 7 días hábiles"
              />
              <OptionCard
                active={shipping === "retiro"}
                onClick={() => setShipping("retiro")}
                icon={<Store className="h-5 w-5" />}
                title="Retiro en local"
                desc="Te avisamos cuando está listo"
              />
            </div>

            {shipping === "envio" && (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field name="street" label="Calle" required className="sm:col-span-2" />
                  <Field name="number" label="Número" required />
                  <Field name="apartment" label="Piso / Depto" />
                  <Field name="city" label="Localidad" required />
                  <Field name="province" label="Provincia" required />
                  <Field name="zip" label="Código postal" required />
                </div>
                <p className="mt-3 rounded-xl bg-stone-bg px-4 py-3 text-sm text-body">
                  El costo del envío no se cobra acá: te contactamos por WhatsApp después de
                  confirmar el pedido para coordinarlo según tu ubicación.
                </p>
              </>
            )}
            {shipping === "retiro" && payment === "efectivo" && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tu pedido quedará <strong>reservado</strong>. Te contactamos para coordinar el retiro y el pago en el local.
              </p>
            )}
          </Section>

          {/* Pago */}
          <Section step={3} title="Pago">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <OptionCard
                active={payment === "mercadopago"}
                onClick={() => setPayment("mercadopago")}
                icon={<CreditCard className="h-5 w-5" />}
                title="MercadoPago"
                desc="Tarjeta y débito"
              />
              <OptionCard
                active={payment === "transferencia"}
                onClick={() => setPayment("transferencia")}
                icon={<Landmark className="h-5 w-5" />}
                title="Transferencia"
                desc={`${transferDiscountPct}% extra de descuento`}
              />
              <OptionCard
                active={payment === "tarjeta_credito"}
                onClick={() => setPayment("tarjeta_credito")}
                icon={<MessageCircle className="h-5 w-5" />}
                title="Tarjeta de crédito"
                desc="Te enviamos el link por WhatsApp"
              />
              {shipping === "retiro" && (
                <OptionCard
                  active={payment === "efectivo"}
                  onClick={() => setPayment("efectivo")}
                  icon={<Store className="h-5 w-5" />}
                  title="Efectivo en local"
                  desc="Pagás al retirar"
                />
              )}
            </div>

            {payment === "mercadopago" && (
              <p className="mt-4 rounded-xl bg-stone-bg px-4 py-3 text-sm text-body">
                Al confirmar serás redirigido a MercadoPago para completar el pago de forma segura.
              </p>
            )}
            {payment === "transferencia" && (
              <div className="mt-4 rounded-xl bg-stone-bg px-4 py-3 text-sm text-body">
                <p className="mb-2 font-medium text-ink">Datos para transferir:</p>
                {transferInfo ? (
                  <ul className="space-y-1">
                    <li>Banco: <strong>{transferInfo.bank}</strong></li>
                    <li>Alias: <strong className="font-mono">{transferInfo.alias}</strong></li>
                    {transferInfo.cbu && <li>CBU: <span className="font-mono">{transferInfo.cbu}</span></li>}
                    <li>Titular: <strong>{transferInfo.holder}</strong></li>
                  </ul>
                ) : (
                  <p className="text-muted">Cargando datos…</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Enviá el comprobante por WhatsApp para confirmar tu pedido.
                </p>
              </div>
            )}
            {payment === "tarjeta_credito" && (
              <p className="mt-4 rounded-xl bg-stone-bg px-4 py-3 text-sm text-body">
                Al confirmar, tu pedido queda <strong>reservado</strong>. Te vamos a contactar por WhatsApp
                para enviarte el link de pago con tarjeta de crédito. Horario de atención: de{" "}
                <strong>lunes a sábado, de 9 a 21 h</strong>.
              </p>
            )}
          </Section>

          <Field name="notes" label="Notas del pedido" />
        </div>

        {/* Columna derecha: resumen */}
        <aside className="h-fit rounded-2xl border border-line p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-semibold text-ink">Tu pedido</h2>
          <ul className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-bg">
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-white">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm leading-tight text-ink">{item.name}</span>
                  {item.variantLabel && (
                    <span className="text-xs text-muted">{item.variantLabel}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-ink">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* Cupón */}
          {couponApplied ? (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium text-brand-700">
                <Tag className="h-4 w-4" /> {couponApplied}
              </span>
              <button type="button" onClick={() => { setCouponApplied(null); setCoupon(null); }} aria-label="Quitar">
                <X className="h-4 w-4 text-brand-700" />
              </button>
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                  placeholder="Cupón"
                  className="flex-1 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-brand"
                />
                <button type="button" onClick={applyCoupon} className="btn-outline px-4 py-2">
                  Aplicar
                </button>
              </div>
              {couponError && <p className="text-xs text-red-600">{couponError}</p>}
            </div>
          )}

          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.couponDiscountAmount > 0 && (
              <Row label={`Descuento (${couponApplied})`} value={`-${formatPrice(totals.couponDiscountAmount)}`} accent />
            )}
            {totals.transferDiscountAmount > 0 && (
              <Row label={`Descuento transferencia (${transferDiscountPct}%)`} value={`-${formatPrice(totals.transferDiscountAmount)}`} accent />
            )}
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-semibold text-ink">Total</span>
            <span className="text-2xl font-semibold text-ink">{formatPrice(totals.total)}</span>
          </div>

          {hasBlockingIssues && (
            <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Hay productos sin stock o no disponibles en tu carrito.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || hasBlockingIssues}
            className="btn-brand mt-6 w-full disabled:opacity-50"
          >
            {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Lock className="h-4 w-4" />}
            {submitting ? "Procesando…" : payment === "mercadopago" ? "Pagar con MercadoPago" : "Confirmar pedido"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">Pago protegido · Tus datos están seguros</p>
        </aside>
      </div>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line p-6">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ name, label, type = "text", required, className, defaultValue }: {
  name: string; label: string; type?: string; required?: boolean;
  className?: string; defaultValue?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm text-body">
        {label}{" "}
        {required ? <span className="text-brand">*</span> : <span className="text-xs text-muted">(opcional)</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

function OptionCard({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition",
        active ? "border-brand bg-brand-50" : "border-line hover:border-brand",
      )}
    >
      <span className={cn("mt-0.5", active ? "text-brand" : "text-ink")}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("flex justify-between", accent ? "text-brand" : "")}>
      <dt className={accent ? "" : "text-body"}>{label}</dt>
      <dd className={accent ? "" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}

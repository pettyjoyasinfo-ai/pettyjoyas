"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Copy, Loader2, MessageCircle, Package } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { apiFetch } from "@/lib/api/client";
import { trackPurchase } from "@/lib/analytics/meta-pixel";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  productId?: string | number | null;
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
};

type StoredOrder = {
  number: string;
  total: number;
  payment: string;
  customer: { email?: string };
  items?: OrderItem[];
  transferInfo?: {
    alias: string;
    cbu?: string;
    bank: string;
    holder: string;
    whatsapp?: string;
  } | null;
};

type LookedUpOrder = {
  number: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  customer: { email: string } | null;
};

export default function OrderConfirmedPage() {
  const clearCart = useCart((s) => s.clear);
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [copied, setCopied] = useState("");

  // ── Flujo transferencia / efectivo: ya viene confirmado desde el checkout ──
  useEffect(() => {
    const raw = sessionStorage.getItem("petty-last-order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // ── Flujo MercadoPago: acá NO confiamos en el ?status= de la URL — puede
  // decir "approved" y el webhook todavía no haber llegado, o el link puede
  // manipularse. Se verifica el estado real contra el backend con el número +
  // email guardados antes de redirigir a MP (petty-pending-order), y recién
  // ahí se vacía el carrito. ──
  const [mpChecking, setMpChecking] = useState(false);
  const [mpNotFound, setMpNotFound] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (order) return; // ya resuelto por sessionStorage (transferencia/efectivo)

    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get("order");
    if (!orderNum) return;

    const pendingRaw = sessionStorage.getItem("petty-pending-order");
    let email = "";
    try {
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      if (pending?.number === orderNum) email = pending.email ?? "";
    } catch {}

    if (!email) {
      setMpNotFound(true);
      return;
    }

    let cancelled = false;
    setMpChecking(true);

    async function poll() {
      if (cancelled) return;
      try {
        const data = await apiFetch<LookedUpOrder>(
          `/orders/lookup?number=${encodeURIComponent(orderNum!)}&email=${encodeURIComponent(email)}`,
        );
        if (cancelled) return;

        if (data.paymentStatus === "aprobado" || data.paymentStatus === "pendiente") {
          // El pedido existe y está en curso (aprobado o esperando acreditación
          // — ej. pago en efectivo por MercadoPago) — ya podemos vaciar el
          // carrito, el pedido quedó registrado del lado del servidor.
          sessionStorage.removeItem("petty-pending-order");
          clearCart();
          setOrder({
            number: data.number,
            total: data.total,
            payment: "mercadopago",
            customer: { email: data.customer?.email },
            items: data.items,
            transferInfo: null,
          });
          setMpChecking(false);
          return;
        }

        // Rechazado: no debería llegar acá normalmente (MP redirige a
        // /checkout en failure), pero por las dudas no tocamos el carrito.
        setMpChecking(false);
        setMpNotFound(true);
      } catch {
        // Puede que el webhook todavía no haya procesado el pago — reintenta
        // unas pocas veces antes de rendirse.
        attemptsRef.current += 1;
        if (attemptsRef.current < 5 && !cancelled) {
          setTimeout(poll, 2500);
        } else if (!cancelled) {
          setMpChecking(false);
          setMpNotFound(true);
        }
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [order, clearCart]);

  // Evento estándar de Meta: compra confirmada. Se dispara una sola vez por
  // pedido — sin esta marca en sessionStorage, un F5 en esta misma página
  // volvería a contar la misma venta de nuevo.
  useEffect(() => {
    if (!order) return;
    const trackedKey = `petty-purchase-tracked-${order.number}`;
    if (sessionStorage.getItem(trackedKey)) return;
    sessionStorage.setItem(trackedKey, "1");
    trackPurchase({
      orderNumber: order.number,
      value: order.total,
      items: (order.items ?? [])
        .filter((it) => it.productId != null)
        .map((it) => ({ id: String(it.productId), quantity: it.quantity })),
    });
  }, [order]);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const isTransfer = order?.payment === "transferencia";
  const isCash = order?.payment === "efectivo";
  const isMp = order?.payment === "mercadopago";
  const isCreditCard = order?.payment === "tarjeta_credito";

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER ?? "543757403878";
  const waMessage = order
    ? encodeURIComponent(
        isCreditCard
          ? `Hola Petty Joyas! Realicé el pedido ${order.number} y quiero coordinar el pago con tarjeta de crédito.`
          : `Hola Petty Joyas! Realicé el pedido ${order.number} y quiero enviar el comprobante de pago.`,
      )
    : "";

  if (mpChecking) {
    return (
      <div className="container-px flex flex-col items-center gap-4 py-28 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-body">Confirmando tu pago con MercadoPago…</p>
      </div>
    );
  }

  if (mpNotFound && !order) {
    return (
      <div className="container-px flex flex-col items-center gap-5 py-28 text-center">
        <h1 className="font-display text-3xl text-ink">No pudimos confirmar tu pago</h1>
        <p className="max-w-md text-body">
          Si ya pagaste, en unos minutos te va a llegar el email de confirmación. Si preferís, escribinos por
          WhatsApp con el número de pedido para que lo revisemos.
        </p>
        <div className="flex gap-3">
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="btn-brand flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
          </a>
          <Link href="/tienda" className="btn-outline">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px flex flex-col items-center py-24 text-center">
      {/* Ícono según estado */}
      <span
        className={`grid h-20 w-20 place-items-center rounded-full ${
          isCash || isCreditCard ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
        }`}
      >
        {isCash || isCreditCard ? <Clock className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
      </span>

      <h1 className="mt-6 font-display text-4xl text-ink">
        {isCash ? "¡Reserva confirmada!" : isCreditCard ? "¡Pedido recibido!" : "¡Gracias por tu compra!"}
      </h1>

      <p className="mt-3 max-w-md text-body">
        {isMp && "Tu pago fue procesado con éxito. Recibirás un email con el comprobante."}
        {isTransfer && "Recibimos tu pedido. Transferí el monto y envianos el comprobante para confirmar."}
        {isCash && "Tu pedido está reservado. Te contactaremos para coordinar el retiro y el pago en el local."}
        {isCreditCard &&
          "Tu pedido quedó reservado. Te vamos a contactar por WhatsApp para enviarte el link de pago con tarjeta (lunes a sábado, de 9 a 21 h)."}
      </p>

      {order && (
        <div className="mt-8 w-full max-w-md rounded-2xl border border-line p-6 text-left">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <Package className="h-6 w-6 text-brand" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Número de pedido</p>
              <p className="font-semibold text-ink">{order.number}</p>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <ul className="mt-4 space-y-2 border-b border-line pb-4 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-body">
                    {it.quantity}× {it.name}
                    {it.variantLabel && <span className="text-muted"> ({it.variantLabel})</span>}
                  </span>
                  <span className="shrink-0 font-medium text-ink">{formatPrice(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-4 space-y-2 text-sm">
            {order.total > 0 && (
              <div className="flex justify-between">
                <dt className="text-body">Total</dt>
                <dd className="font-semibold text-ink">{formatPrice(order.total)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-body">Medio de pago</dt>
              <dd className="font-medium text-ink capitalize">
                {order.payment === "mercadopago"
                  ? "MercadoPago"
                  : order.payment === "transferencia"
                    ? "Transferencia"
                    : order.payment === "tarjeta_credito"
                      ? "Tarjeta de crédito"
                      : "Efectivo en local"}
              </dd>
            </div>
            {order.customer.email && (
              <div className="flex justify-between">
                <dt className="text-body">Email</dt>
                <dd className="font-medium text-ink">{order.customer.email}</dd>
              </div>
            )}
          </dl>

          {/* Datos de transferencia */}
          {isTransfer && order.transferInfo && (
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm">
              <p className="mb-3 font-semibold text-ink">Datos para transferir</p>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-body">Banco</span>
                  <span className="font-medium text-ink">{order.transferInfo.bank}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-body">Alias</span>
                  <button
                    onClick={() => copyToClipboard(order.transferInfo!.alias, "alias")}
                    className="flex items-center gap-1.5 font-mono font-medium text-ink hover:text-brand"
                  >
                    {order.transferInfo.alias}
                    <Copy className={`h-3.5 w-3.5 ${copied === "alias" ? "text-green-600" : "text-muted"}`} />
                  </button>
                </li>
                {order.transferInfo.cbu && (
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-body">CBU</span>
                    <button
                      onClick={() => copyToClipboard(order.transferInfo!.cbu!, "cbu")}
                      className="flex items-center gap-1.5 font-mono text-xs text-ink hover:text-brand"
                    >
                      {order.transferInfo.cbu}
                      <Copy className={`h-3.5 w-3.5 ${copied === "cbu" ? "text-green-600" : "text-muted"}`} />
                    </button>
                  </li>
                )}
                <li className="flex items-center justify-between">
                  <span className="text-body">Titular</span>
                  <span className="font-medium text-ink">{order.transferInfo.holder}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {(isTransfer || isCreditCard) && (
          <a
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="btn-brand flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {isCreditCard ? "Escribir por WhatsApp" : "Enviar comprobante por WhatsApp"}
          </a>
        )}
        <Link href="/tienda" className={isTransfer || isCreditCard ? "btn-outline" : "btn-brand"}>
          Seguir comprando
        </Link>
        <Link href="/cuenta" className="btn-outline">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}

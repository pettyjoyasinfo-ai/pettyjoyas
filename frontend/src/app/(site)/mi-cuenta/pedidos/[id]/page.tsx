"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CreditCard, MapPin, Truck } from "lucide-react";
import { useMyOrder } from "@/lib/api/account";
import { ORDER_STATUS_STYLE } from "@/lib/status-styles";
import { LoadingScreen } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useMyOrder(id);

  if (isLoading || !order) return <LoadingScreen />;

  return (
    <div>
      <Link href="/mi-cuenta/pedidos" className="text-sm text-muted hover:text-brand">← Volver a mis pedidos</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Pedido {order.number}</h1>
          <p className="text-sm text-body">{new Date(order.createdAt).toLocaleString("es-AR")}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${ORDER_STATUS_STYLE[order.status]}`}>{order.status}</span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line">
          <ul className="divide-y divide-line">
            {order.items.map((it: any, i: number) => (
              <li key={i} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-ink">{it.name}</p>
                  <p className="text-xs text-muted">{it.variantLabel ?? ""} · x{it.quantity}</p>
                </div>
                <span className="font-semibold text-ink">{formatPrice(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line bg-stone-bg/50 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-body">Subtotal</dt><dd className="text-ink">{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-brand"><dt>Descuento {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>-{formatPrice(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-body">Envío</dt><dd className="text-ink">{order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt className="text-ink">Total</dt><dd className="text-ink">{formatPrice(order.total)}</dd></div>
          </dl>
        </div>

        <div className="flex h-fit flex-col gap-4">
          {order.address && (
            <div className="rounded-2xl border border-line p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><MapPin className="h-4 w-4 text-brand" /> Envío</p>
              <p className="mt-2 text-sm text-body">{[order.address.street, order.address.number, order.address.city, order.address.zip].filter(Boolean).join(", ")}</p>
            </div>
          )}
          <div className="rounded-2xl border border-line p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><CreditCard className="h-4 w-4 text-brand" /> Pago</p>
            <p className="mt-2 text-sm capitalize text-body">{order.paymentMethod ?? "—"} · {order.paymentStatus}</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Truck className="h-4 w-4 text-brand" /> Entrega</p>
            <p className="mt-2 text-sm capitalize text-body">{order.shippingMethod ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

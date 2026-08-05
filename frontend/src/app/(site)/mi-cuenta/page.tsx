"use client";

import Link from "next/link";
import { Gift, Package, Tag } from "lucide-react";
import { useActiveCoupons, useMyOrders } from "@/lib/api/account";
import { useAuth } from "@/lib/auth/store";
import { ORDER_STATUS_STYLE } from "@/lib/status-styles";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";

export default function ResumenPage() {
  const user = useAuth((s) => s.user);
  const { data: orders = [], isLoading } = useMyOrders();
  const { data: coupons = [] } = useActiveCoupons();
  const recent = orders.slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">¡Hola, {user?.name?.split(" ")[0] ?? ""}! 👋</h1>
      <p className="mt-1 text-sm text-body">Desde acá seguís tus pedidos y usás tus cupones.</p>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line p-5">
          <Package className="h-6 w-6 text-brand" />
          <p className="mt-3 text-2xl font-semibold text-ink">{orders.length}</p>
          <p className="text-sm text-body">Pedidos realizados</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <Tag className="h-6 w-6 text-brand" />
          <p className="mt-3 text-2xl font-semibold text-ink">{coupons.length}</p>
          <p className="text-sm text-body">Cupones disponibles</p>
        </div>
        <div className="rounded-2xl bg-khaki-100 p-5">
          <Gift className="h-6 w-6 text-gold-700" />
          <p className="mt-3 font-display text-lg leading-tight text-ink">Beneficios</p>
          <p className="text-sm text-body">Sumá puntos y descuentos exclusivos.</p>
        </div>
      </div>

      <div className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Últimos pedidos</h2>
          <Link href="/mi-cuenta/pedidos" className="text-sm font-medium text-brand">Ver todos →</Link>
        </div>
        {isLoading ? (
          <Spinner className="text-brand" />
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-12 text-center">
            <p className="text-body">Todavía no hiciste pedidos.</p>
            <Link href="/tienda" className="btn-brand mt-4 inline-flex">Ir a la tienda</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {recent.map((o: any) => (
                  <tr key={o.id} className="transition hover:bg-stone-bg/60">
                    <td className="px-5 py-3.5 font-medium text-ink">
                      <Link href={`/mi-cuenta/pedidos/${o.id}`}>{o.number}</Link>
                    </td>
                    <td className="hidden px-5 py-3.5 text-body sm:table-cell">{new Date(o.createdAt).toLocaleDateString("es-AR")}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ORDER_STATUS_STYLE[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-ink">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

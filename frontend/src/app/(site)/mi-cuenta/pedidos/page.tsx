"use client";

import Link from "next/link";
import { useMyOrders } from "@/lib/api/account";
import { ORDER_STATUS_STYLE } from "@/lib/status-styles";
import { LoadingScreen } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";

export default function PedidosPage() {
  const { data: orders = [], isLoading } = useMyOrders();

  if (isLoading) return <LoadingScreen />;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Mis pedidos</h1>
      <p className="mt-1 text-sm text-body">Historial completo de tus compras.</p>

      {orders.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-body">No tenés pedidos todavía.</p>
          <Link href="/tienda" className="btn-brand mt-4 inline-flex">Ir a la tienda</Link>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-stone-bg text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Fecha</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o: any) => (
                <tr key={o.id} className="transition hover:bg-stone-bg/60">
                  <td className="px-5 py-4 font-medium text-ink">{o.number}</td>
                  <td className="hidden px-5 py-4 text-body sm:table-cell">{new Date(o.createdAt).toLocaleDateString("es-AR")}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ORDER_STATUS_STYLE[o.status]}`}>{o.status}</span></td>
                  <td className="px-5 py-4 text-right font-semibold text-ink">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/mi-cuenta/pedidos/${o.id}`} className="text-sm font-medium text-brand hover:underline">Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

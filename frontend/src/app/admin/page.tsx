"use client";

import Link from "next/link";
import { AlertTriangle, DollarSign, Percent, ShoppingBag, Users } from "lucide-react";
import { Badge, Card, PageHeader, StatCard } from "@/components/admin/ui";
import { LoadingScreen } from "@/components/ui/spinner";
import { useAdminOrders, useAdminProducts, useDashboard } from "@/lib/api/admin";
import { ORDER_STATUS_STYLE } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboard(30);
  const { data: orders = [] } = useAdminOrders();
  const { data: products = [] } = useAdminProducts();

  if (isLoading || !stats) return <LoadingScreen label="Cargando métricas…" />;

  const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 5).slice(0, 4);
  const recent = orders.slice(0, 5);

  const byChannel = orders.reduce(
    (acc: any, o: any) => {
      const ch = o.channel === "local" ? "local" : "online";
      acc[ch] += o.total;
      return acc;
    },
    { online: 0, local: 0 },
  );
  const totalChannel = Math.max(1, byChannel.online + byChannel.local);

  return (
    <>
      <PageHeader title="Dashboard" description="Resumen del negocio · últimos 30 días" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas del mes" value={formatPrice(stats.revenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Pedidos" value={String(stats.orders)} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Ticket promedio" value={formatPrice(stats.avgTicket)} icon={<Percent className="h-5 w-5" />} />
        <StatCard label="Nuevos clientes" value={String(stats.newCustomers)} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card title="Ventas por canal" className="xl:col-span-2">
          <div className="flex flex-col gap-4">
            {[
              { label: "Tienda online", value: byChannel.online, color: "bg-brand" },
              { label: "Local (POS)", value: byChannel.local, color: "bg-gold" },
            ].map((c) => (
              <div key={c.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-body">{c.label}</span>
                  <span className="font-semibold text-ink">{formatPrice(c.value)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-stone-bg">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${(c.value / totalChannel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Alertas de stock bajo" action={<Link href="/admin/productos" className="text-xs font-medium text-brand">Ver inventario</Link>}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Sin alertas. Todo con stock saludable.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
                  <span className="flex items-center gap-2.5 text-sm text-ink">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> {p.name}
                  </span>
                  <Badge className="bg-white text-amber-700">{p.stock} u.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card title="Pedidos recientes" padded={false} className="xl:col-span-2"
          action={<Link href="/admin/pedidos" className="text-xs font-medium text-brand">Ver todos</Link>}>
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-muted">Todavía no hay pedidos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o: any) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-3.5 transition hover:bg-stone-bg/60">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{o.number}</p>
                      <p className="truncate text-xs text-muted">{o.customer?.name ?? "Invitado"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={o.channel === "local" ? "bg-gold-100 text-gold-700" : "bg-blue-50 text-blue-700"}>{o.channel}</Badge>
                      <Badge className={ORDER_STATUS_STYLE[o.status]}>{o.status}</Badge>
                      <span className="w-24 text-right text-sm font-semibold text-ink">{formatPrice(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Más vendidos del mes">
          {(stats.topProducts ?? []).length === 0 ? (
            <p className="text-sm text-muted">Sin ventas aún.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {stats.topProducts.map((p: any, i: number) => {
                const max = stats.topProducts[0].sold || 1;
                return (
                  <li key={p.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink">{i + 1}. {p.name}</span>
                      <span className="text-muted">{p.sold} u.</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-bg">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${(p.sold / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

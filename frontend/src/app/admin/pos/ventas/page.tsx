"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useAdminOrders, useEditPosSale } from "@/lib/api/admin";
import { ORDER_STATUS_STYLE, PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

type PosOrder = {
  id: string;
  number: string;
  status: string;
  paymentMethod: string;
  total: number;
  customer: { name: string; email: string } | null;
  createdAt: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function PosVentasPage() {
  const [date, setDate] = useState(todayStr());
  const [editing, setEditing] = useState<PosOrder | null>(null);

  const { data, isLoading } = useAdminOrders(`?canal=local&fecha_desde=${date}&fecha_hasta=${date}`);
  const orders = (data ?? []) as PosOrder[];

  return (
    <>
      <PageHeader
        title="Ventas presenciales"
        description="Historial de ventas del local — corregí medio de pago o monto sin cerrar caja."
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-line px-3 py-1.5 text-xs text-ink"
            />
            <Link
              href="/admin/pos"
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al POS
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted">Cargando ventas…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">
          No hay ventas presenciales ese día.
        </div>
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-line">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{o.number}</p>
                    <p className="text-xs text-muted">
                      {fmtTime(o.createdAt)} · {o.customer?.name ?? "Sin cliente"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={ORDER_STATUS_STYLE[o.status] ?? "bg-stone-bg text-body"}>{o.status}</Badge>
                  <span className="text-xs text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod}</span>
                  <span className="text-sm font-semibold text-ink">{formatPrice(o.total)}</span>
                  <button
                    onClick={() => setEditing(o)}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {editing && <EditSaleModal order={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditSaleModal({ order, onClose }: { order: PosOrder; onClose: () => void }) {
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);
  const [total, setTotal] = useState(String(order.total));
  const edit = useEditPosSale();
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum < 0) {
      setError("El monto no es válido.");
      return;
    }
    try {
      await edit.mutateAsync({ id: order.id, payment_method: paymentMethod, total: totalNum });
      onClose();
    } catch {
      setError("No se pudo guardar el cambio. Probá de nuevo.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">Editar {order.number}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-body">Medio de pago</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-body">Monto</span>
            <input
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              inputMode="numeric"
              className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="button" onClick={save} disabled={edit.isPending} className="btn-brand disabled:opacity-50">
              {edit.isPending ? <Spinner className="h-4 w-4" /> : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Pencil, Search, X } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useAdminOrders, useEditPosSale } from "@/lib/api/admin";
import { ORDER_STATUS_STYLE, PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

type PosOrderItem = {
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
};

type PosOrder = {
  id: string;
  number: string;
  status: string;
  kind?: string;
  paymentMethod: string;
  total: number;
  customer: { name: string; email: string } | null;
  items?: PosOrderItem[];
  createdAt: string;
};

const AR_TZ = "America/Argentina/Buenos_Aires";

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: AR_TZ });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  });
}

function shortDate(ymd: string) {
  const [, m, d] = ymd.split("-");
  return m && d ? `${d}/${m}` : ymd;
}

export default function PosVentasPage() {
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [onlySelectedDate, setOnlySelectedDate] = useState(false);
  const [editing, setEditing] = useState<PosOrder | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const trimmedQ = debouncedQ.trim();
  const isSearching = trimmedQ.length >= 2;
  const queryParams = isSearching
    ? `?canal=local&q=${encodeURIComponent(trimmedQ)}&per_page=50${onlySelectedDate ? `&fecha_desde=${date}&fecha_hasta=${date}` : ""}`
    : `?canal=local&fecha_desde=${date}&fecha_hasta=${date}&per_page=50`;

  const { data, isLoading } = useAdminOrders(queryParams);
  const orders = (data ?? []) as PosOrder[];
  const needle = trimmedQ.toLowerCase();

  return (
    <>
      <PageHeader
        title="Ventas presenciales"
        description="Historial de ventas del local — buscá por producto vendido o corregí medio de pago y monto."
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 focus-within:border-brand">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, variante, cliente o N° de venta…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="text-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isSearching && (
          <button
            type="button"
            onClick={() => setOnlySelectedDate((v) => !v)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              onlySelectedDate
                ? "border-brand bg-brand-50 text-brand"
                : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {onlySelectedDate ? `Solo el ${shortDate(date)}` : "Buscando en todas las fechas"}
          </button>
        )}

        {isSearching && !isLoading && (
          <span className="text-xs text-muted">
            {orders.length} {orders.length === 1 ? "resultado" : "resultados"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted">Cargando ventas…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">
          {isSearching
            ? `No se encontraron ventas para “${trimmedQ}”${onlySelectedDate ? ` el ${shortDate(date)}` : ""}.`
            : "No hay ventas presenciales ese día."}
        </div>
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-line">
            {orders.map((o) => (
              <div key={o.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {o.number}
                      {o.kind && o.kind !== "venta" && (
                        <Badge className="bg-blue-50 text-blue-700">
                          {o.kind === "cambio" ? "Cambio" : "Devolución"}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {isSearching && !onlySelectedDate ? fmtDateTime(o.createdAt) : fmtTime(o.createdAt)} ·{" "}
                      {o.customer?.name ?? "Sin cliente"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge className={ORDER_STATUS_STYLE[o.status] ?? "bg-stone-bg text-body"}>{o.status}</Badge>
                    <span className="text-xs text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod}</span>
                    <span className="text-sm font-semibold text-ink">{formatPrice(o.total)}</span>
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </Link>
                    <button
                      onClick={() => setEditing(o)}
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  </div>
                </div>

                {o.items && o.items.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-line/60 pt-2">
                    {o.items.map((it, idx) => {
                      const matches =
                        isSearching &&
                        (it.name.toLowerCase().includes(needle) ||
                          (it.variantLabel?.toLowerCase().includes(needle) ?? false));
                      return (
                        <li
                          key={idx}
                          className={`flex items-center justify-between gap-3 text-xs ${
                            matches ? "font-medium text-brand" : "text-body"
                          }`}
                        >
                          <span className="truncate">
                            {it.name}
                            {it.variantLabel ? ` · ${it.variantLabel}` : ""} ×{it.quantity}
                          </span>
                          <span className="shrink-0">{formatPrice(it.unitPrice * it.quantity)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
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

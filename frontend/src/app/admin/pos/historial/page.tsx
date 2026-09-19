"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Banknote, Eye, TrendingUp, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { adminApiFetch } from "@/lib/api/client";
import { PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

type RegisterSummary = {
  id: number;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_cash: number | null;
  notes: string | null;
  opened_by: string;
  closed_by: string | null;
  summary: {
    efectivo: { count: number; total: number };
    transferencia: { count: number; total: number };
    tarjeta: { count: number; total: number };
    total: number;
    count: number;
  };
};

type SaleDetail = {
  id: string;
  number: string;
  status: string;
  paymentMethod: string;
  total: number;
  customer: { name: string } | null;
  items: { name: string; variantLabel: string | null; unitPrice: number; quantity: number }[];
  createdAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function PosHistorialPage() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: registers = [], isLoading } = useQuery<RegisterSummary[]>({
    queryKey: ["pos", "cash-register", "history"],
    queryFn: () => adminApiFetch("/pos/cash-register/history"),
    staleTime: 30_000,
  });

  return (
    <>
      <PageHeader
        title="Historial de cajas"
        description="Registro de sesiones de caja abiertas y cerradas."
        action={
          <Link
            href="/admin/pos"
            className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al POS
          </Link>
        }
      />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted">Cargando historial…</div>
      ) : registers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">
          No hay cajas registradas todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {registers.map(r => {
            const diff = r.closing_amount != null && r.expected_cash != null
              ? r.closing_amount - r.expected_cash
              : null;
            const sinCaja = r.notes?.includes("sin caja") ?? false;

            return (
              <Card key={r.id} padded={false}>
                <div className="px-5 py-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100">
                        <Banknote className="h-4 w-4 text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {fmt(r.opened_at)}
                          {r.closed_at && <span className="text-muted font-normal"> → {fmt(r.closed_at)}</span>}
                        </p>
                        <p className="text-xs text-muted">Abierta por {r.opened_by}{r.closed_by ? ` · Cerrada por ${r.closed_by}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sinCaja && <Badge className="bg-stone-100 text-stone-500">Sin caja</Badge>}
                      <Badge className={r.status === "open" ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"}>
                        {r.status === "open" ? "Abierta" : "Cerrada"}
                      </Badge>
                      <span className="text-xs font-semibold text-ink">{formatPrice(r.summary.total)} total</span>
                      <button
                        onClick={() => setDetailId(r.id)}
                        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver detalles
                      </button>
                    </div>
                  </div>

                  {/* Sales breakdown */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {(["efectivo", "transferencia", "tarjeta"] as const).map(key => {
                      const row = r.summary[key];
                      const colors = {
                        efectivo: "bg-green-50 text-green-700",
                        transferencia: "bg-blue-50 text-blue-700",
                        tarjeta: "bg-brand-50 text-brand",
                      };
                      const labels = { efectivo: "Efectivo", transferencia: "Transfer", tarjeta: "Tarjeta" };
                      return (
                        <div key={key} className={`rounded-xl px-3 py-2.5 ${colors[key]}`}>
                          <p className="text-[10px] font-medium opacity-80">{labels[key]}</p>
                          <p className="text-sm font-semibold">{formatPrice(row.total)}</p>
                          <p className="text-[10px] opacity-70">{row.count} {row.count === 1 ? "venta" : "ventas"}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cash reconciliation */}
                  {r.status === "closed" && !sinCaja && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 px-4 py-3 text-xs">
                      <div>
                        <span className="text-muted">Apertura</span>
                        <span className="ml-1.5 font-medium text-ink">{formatPrice(r.opening_amount)}</span>
                      </div>
                      <div>
                        <span className="text-muted">Esperado en caja</span>
                        <span className="ml-1.5 font-medium text-ink">{r.expected_cash != null ? formatPrice(r.expected_cash) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted">Contado</span>
                        <span className="ml-1.5 font-medium text-ink">{r.closing_amount != null ? formatPrice(r.closing_amount) : "—"}</span>
                      </div>
                      {diff != null && (
                        <div className={diff < 0 ? "text-red-600" : diff > 0 ? "text-amber-700" : "text-green-700"}>
                          <TrendingUp className="inline h-3 w-3" />
                          <span className="ml-1 font-semibold">{diff >= 0 ? "+" : ""}{formatPrice(diff)}</span>
                          <span className="ml-1 text-current/70">diferencia</span>
                        </div>
                      )}
                    </div>
                  )}

                  {r.notes && !sinCaja && (
                    <p className="mt-2 text-xs text-muted italic">Nota: {r.notes}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {detailId != null && <SessionDetailModal cashRegisterId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

function SessionDetailModal({ cashRegisterId, onClose }: { cashRegisterId: number; onClose: () => void }) {
  const { data: sales = [], isLoading } = useQuery<SaleDetail[]>({
    queryKey: ["pos", "cash-register", "sales", cashRegisterId],
    queryFn: () => adminApiFetch(`/pos/cash-register/${cashRegisterId}/sales`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">Ventas de la sesión</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted">Cargando ventas…</div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No hubo ventas en esta sesión.</div>
          ) : (
            <div className="divide-y divide-line">
              {sales.map(s => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.number}</p>
                      <p className="text-xs text-muted">
                        {fmtTime(s.createdAt)} · {s.customer?.name ?? "Sin cliente"} · {PAYMENT_METHOD_LABEL[s.paymentMethod] ?? s.paymentMethod}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink">{formatPrice(s.total)}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {s.items.map((it, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 text-xs text-body">
                        <span className="truncate">
                          {it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ""} x{it.quantity}
                        </span>
                        <span className="shrink-0">{formatPrice(it.unitPrice * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

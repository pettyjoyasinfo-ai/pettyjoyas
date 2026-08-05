"use client";

import { useState } from "react";
import { AlertCircle, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Minus } from "lucide-react";
import { Badge, Card, CardGrid, KV, PageHeader } from "@/components/admin/ui";
import { LoadingScreen } from "@/components/ui/spinner";
import {
  useComparison,
  useCouponReport,
  useDashboard,
  usePaymentBreakdown,
  useTopCustomers,
} from "@/lib/api/admin";
import { SEGMENT_STYLE } from "@/lib/status-styles";
import { cn, formatPrice } from "@/lib/utils";

type Period = "mensual" | "trimestral" | "anual" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
  custom: "Personalizado",
};

function delta(now: number, before: number) {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Canal + método de pago REAL (sin agrupar) — el POS ya no usa MercadoPago
// (se sacó esa integración: ahora es efectivo, tarjeta o transferencia), así
// que agruparlo bajo "MP" quedaba mal. Online sigue usando MercadoPago real
// (Checkout Pro) o transferencia.
function breakdownKey(channel: string | null, method: string | null) {
  const ch = (channel ?? "").toLowerCase();
  const mt = (method ?? "").toLowerCase() || "otro";
  const isOnline = ch === "online" || ch === "tienda";
  return `${isOnline ? "online" : "pos"}:${mt}`;
}

const BREAKDOWN_CELLS = [
  { key: "online:mercadopago",   label: "Online · MercadoPago",   sub: "Tienda web",       color: "bg-brand-50 text-brand" },
  { key: "online:transferencia", label: "Online · Transferencia", sub: "Tienda web",       color: "bg-blue-50 text-blue-700" },
  { key: "pos:efectivo",         label: "POS · Efectivo",         sub: "Venta presencial", color: "bg-green-50 text-green-700" },
  { key: "pos:tarjeta",          label: "POS · Tarjeta",          sub: "Venta presencial", color: "bg-amber-50 text-amber-700" },
  { key: "pos:transferencia",    label: "POS · Transferencia",    sub: "Venta presencial", color: "bg-purple-50 text-purple-700" },
];

export default function AdminReportes() {
  const [period, setPeriod] = useState<Period>("mensual");
  const [customFrom, setCustomFrom] = useState(monthStartStr());
  const [customTo, setCustomTo]     = useState(todayStr());
  const [exporting, setExporting]   = useState(false);

  const from = period === "custom" ? customFrom : undefined;
  const to   = period === "custom" ? customTo   : undefined;

  const { data: cmp, isLoading, isError } = useComparison(period, from, to);
  const { data: dash }                    = useDashboard(30);
  const { data: topCustomers = [] } = useTopCustomers();
  const { data: coupons = [] }   = useCouponReport();
  const { data: payData }        = usePaymentBreakdown(from, to);

  // Aggregate payment breakdown rows into the 5 fixed cells (ver BREAKDOWN_CELLS)
  const breakdown: Record<string, { count: number; total: number }> = {
    "online:mercadopago": { count: 0, total: 0 },
    "online:transferencia": { count: 0, total: 0 },
    "pos:efectivo": { count: 0, total: 0 },
    "pos:tarjeta": { count: 0, total: 0 },
    "pos:transferencia": { count: 0, total: 0 },
  };
  for (const row of (payData?.breakdown ?? [])) {
    const k = breakdownKey(row.channel, row.paymentMethod);
    if (breakdown[k]) {
      breakdown[k].count += row.count;
      breakdown[k].total += row.total;
    }
  }
  const breakdownTotal = Object.values(breakdown).reduce((s, v) => s + v.total, 0);

  async function exportExcel() {
    if (!cmp) return;
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Petty Joyas";
      wb.created = new Date();

      // ── Hoja 1: Comparativa ──
      const sh1 = wb.addWorksheet("Comparativa");
      sh1.columns = [
        { header: "Métrica",          key: "metric",  width: 22 },
        { header: cmp.current.label,  key: "current", width: 22 },
        { header: cmp.previous.label, key: "previous", width: 22 },
        { header: "Variación %",      key: "delta",   width: 14 },
      ];
      sh1.getRow(1).font = { bold: true };
      const compRows = [
        { metric: "Ingresos (ARS)",    current: cmp.current.revenue,      previous: cmp.previous.revenue,      money: true },
        { metric: "Pedidos",           current: cmp.current.orders,        previous: cmp.previous.orders,       money: false },
        { metric: "Ticket promedio",   current: cmp.current.avgTicket,     previous: cmp.previous.avgTicket,    money: true },
        { metric: "Nuevos clientes",   current: cmp.current.newCustomers,  previous: cmp.previous.newCustomers, money: false },
      ];
      compRows.forEach((r) => {
        const d = delta(r.current, r.previous);
        sh1.addRow({ metric: r.metric, current: r.current, previous: r.previous, delta: d !== null ? `${d > 0 ? "+" : ""}${d}%` : "—" });
      });

      // ── Hoja 2: Canales de pago ──
      const sh2 = wb.addWorksheet("Canales de pago");
      sh2.columns = [
        { header: "Canal",           key: "label",   width: 30 },
        { header: "Pedidos",         key: "count",   width: 12 },
        { header: "Total (ARS)",     key: "total",   width: 18 },
        { header: "% del total",     key: "pct",     width: 14 },
      ];
      sh2.getRow(1).font = { bold: true };
      BREAKDOWN_CELLS.forEach((cell) => {
        const v = breakdown[cell.key];
        sh2.addRow({
          label: cell.label,
          count: v.count,
          total: v.total,
          pct: breakdownTotal ? `${Math.round((v.total / breakdownTotal) * 100)}%` : "—",
        });
      });
      sh2.addRow({ label: "TOTAL", count: Object.values(breakdown).reduce((s, v) => s + v.count, 0), total: breakdownTotal, pct: "100%" });
      sh2.lastRow!.font = { bold: true };

      // ── Hoja 3: Productos top ──
      const sh3 = wb.addWorksheet("Productos top");
      sh3.columns = [
        { header: "Producto",      key: "name",    width: 36 },
        { header: "Unidades",      key: "sold",    width: 12 },
        { header: "Facturado ARS", key: "revenue", width: 18 },
      ];
      sh3.getRow(1).font = { bold: true };
      (dash?.topProducts ?? []).forEach((p: any) => sh3.addRow(p));

      // ── Hoja 4: Clientes LTV ──
      const sh4 = wb.addWorksheet("Clientes LTV");
      sh4.columns = [
        { header: "Cliente",   key: "name",    width: 30 },
        { header: "Segmento",  key: "segment", width: 16 },
        { header: "Pedidos",   key: "orders",  width: 12 },
        { header: "LTV ARS",   key: "ltv",     width: 18 },
      ];
      sh4.getRow(1).font = { bold: true };
      topCustomers.forEach((c: any) => sh4.addRow(c));

      // ── Hoja 5: Cupones ──
      const sh5 = wb.addWorksheet("Cupones");
      sh5.columns = [
        { header: "Código",       key: "code",     width: 18 },
        { header: "Usos",         key: "uses",     width: 10 },
        { header: "Descuento ARS",key: "discount", width: 18 },
        { header: "Ventas ARS",   key: "revenue",  width: 18 },
      ];
      sh5.getRow(1).font = { bold: true };
      (coupons as any[]).forEach((c) => sh5.addRow(c));

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reportes-pettyjoyas-${todayStr()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) return <LoadingScreen label="Calculando reportes…" />;

  if (isError || !cmp) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm font-medium text-ink">No se pudieron cargar los reportes</p>
      <p className="text-xs text-muted">Verificá que el backend esté corriendo y recargá la página.</p>
    </div>
  );

  const compRows = [
    { label: "Ingresos",        now: cmp.current.revenue,     before: cmp.previous.revenue,     money: true  },
    { label: "Pedidos",         now: cmp.current.orders,      before: cmp.previous.orders,      money: false },
    { label: "Ticket promedio", now: cmp.current.avgTicket,   before: cmp.previous.avgTicket,   money: true  },
    { label: "Nuevos clientes", now: cmp.current.newCustomers,before: cmp.previous.newCustomers,money: false },
  ];
  const maxRev = Math.max(cmp.current.revenue, cmp.previous.revenue, 1);

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Métricas del negocio con comparación contra el período anterior."
        action={
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="btn-outline flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {exporting ? "Exportando…" : "Exportar Excel"}
          </button>
        }
      />

      {/* ─── Filtro de período ─── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-line bg-white p-1">
          {(["mensual", "trimestral", "anual", "custom"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition",
                period === p ? "bg-ink text-white" : "text-body hover:text-ink"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {period === "custom" ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-xl border border-line px-3 py-1.5 text-xs outline-none focus:border-brand"
            />
            <span className="text-xs text-muted">→</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={todayStr()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-xl border border-line px-3 py-1.5 text-xs outline-none focus:border-brand"
            />
          </div>
        ) : (
          <p className="text-sm text-body">
            <span className="font-medium text-ink">{cmp.current.label}</span>
            <span className="mx-1.5 text-muted">vs.</span>
            {cmp.previous.label}
          </p>
        )}
      </div>

      {/* ─── 4 comparativas ─── */}
      <CardGrid className="xl:grid-cols-4">
        {compRows.map((r) => {
          const d = delta(r.now, r.before);
          const pos = d !== null && d >= 0;
          return (
            <div key={r.label} className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {r.money ? formatPrice(r.now) : r.now}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted">
                  Antes: {r.money ? formatPrice(r.before) : r.before}
                </span>
                {d === null ? (
                  <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-muted">
                    <Minus className="h-3 w-3" /> —
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      pos ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    )}
                  >
                    {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {pos ? "+" : ""}{d}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardGrid>

      {/* ─── Gráfico de barras ingresos ─── */}
      <div className="mt-5">
        <Card title={`Ingresos: ${cmp.current.label} vs ${cmp.previous.label}`}>
          <div className="flex items-end gap-8">
            {[
              { l: cmp.previous.label, v: cmp.previous.revenue, c: "bg-khaki-300" },
              { l: cmp.current.label,  v: cmp.current.revenue,  c: "bg-brand" },
            ].map((b) => (
              <div key={b.l} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-semibold text-ink">{formatPrice(b.v)}</span>
                <div
                  className={`w-full max-w-[160px] rounded-t-xl ${b.c}`}
                  style={{ height: `${Math.max(8, (b.v / maxRev) * 180)}px` }}
                />
                <span className="text-xs text-muted">{b.l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Desglose por canal de pago (5 celdas: 2 online + 3 POS) ─── */}
      <div className="mt-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Ingresos por canal de pago</h2>
        <CardGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BREAKDOWN_CELLS.map((cell) => {
            const v = breakdown[cell.key];
            const pct = breakdownTotal ? Math.round((v.total / breakdownTotal) * 100) : 0;
            return (
              <div key={cell.key} className="rounded-2xl border border-line bg-white p-5">
                <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-medium", cell.color)}>
                  {cell.label}
                </span>
                <p className="mt-3 text-xl font-semibold text-ink">{formatPrice(v.total)}</p>
                <p className="text-xs text-muted">{v.count} pedidos · {pct}% del total</p>
                <p className="mt-1 text-xs text-muted">{cell.sub}</p>
              </div>
            );
          })}
        </CardGrid>
      </div>

      {/* ─── Productos + Clientes ─── */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold text-ink">Productos más vendidos</h2>
          <CardGrid className="sm:grid-cols-2 xl:grid-cols-2">
            {(dash?.topProducts ?? []).map((p: any, i: number) => (
              <div key={p.name} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-sm font-medium text-ink">{i + 1}. {p.name}</p>
                <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                  <KV label="Vendidos">{p.sold} u.</KV>
                  <KV label="Facturado"><span className="font-semibold">{formatPrice(p.revenue)}</span></KV>
                </div>
              </div>
            ))}
          </CardGrid>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-ink">Clientes más valiosos (LTV)</h2>
          <div className="flex flex-col gap-3">
            {topCustomers.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-3.5">
                <span className="font-display text-lg text-khaki-300">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-muted">{c.orders} pedidos</p>
                </div>
                {c.segment && <Badge className={SEGMENT_STYLE[c.segment]}>{c.segment}</Badge>}
                <span className="w-28 text-right font-semibold text-ink">{formatPrice(c.ltv)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Cupones ─── */}
      <div className="mt-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Rendimiento de cupones</h2>
        <CardGrid>
          {(coupons as any[]).map((c) => (
            <div key={c.code} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-ink">{c.code}</span>
                <Badge className="bg-green-50 text-green-700">
                  ROI {c.discount ? (c.revenue / c.discount).toFixed(1) : "—"}x
                </Badge>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                <KV label="Usos">{c.uses}</KV>
                <KV label="Descuento"><span className="text-red-500">-{formatPrice(c.discount)}</span></KV>
                <KV label="Ventas"><span className="font-semibold">{formatPrice(c.revenue)}</span></KV>
              </div>
            </div>
          ))}
        </CardGrid>
      </div>
    </>
  );
}

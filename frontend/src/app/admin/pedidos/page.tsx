"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Filter, X } from "lucide-react";
import { Badge, CardGrid, KV, PageHeader } from "@/components/admin/ui";
import { LoadingScreen } from "@/components/ui/spinner";
import { fetchOrdersExport, useAdminOrders, useUpdateOrderStatus } from "@/lib/api/admin";
import { ORDER_STATUS_STYLE, ORDER_STATUSES, PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

// ── Filtros por defecto ──────────────────────────────────────────────────────
const EMPTY_FILTERS = {
  estado: "",
  canal: "",
  metodo_pago: "",
  fecha_desde: "",
  fecha_hasta: "",
  total_min: "",
  total_max: "",
  q: "",
};

const PAYMENT_METHODS = ["mercadopago", "transferencia", "efectivo", "tarjeta_credito", "reserva"];

// ── Export XLSX ──────────────────────────────────────────────────────────────
async function exportToXLSX(orders: any[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Petty Joyas";
  wb.created = new Date();

  const ws = wb.addWorksheet("Pedidos", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  const BRAND = "FF821f40";
  const LIGHT_PINK = "FFFCE8EF";
  const ROW_ALT = "FFFAF5F7";
  const WHITE = "FFFFFFFF";

  // ── Título ──
  ws.mergeCells("A1:N1");
  const title = ws.getCell("A1");
  title.value = "PETTY JOYAS — Exportación de Pedidos";
  title.font = { bold: true, size: 14, color: { argb: BRAND } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_PINK } };
  ws.getRow(1).height = 28;

  // ── Subtítulo (fecha + cantidad) ──
  ws.mergeCells("A2:N2");
  const sub = ws.getCell("A2");
  sub.value = `Generado el ${new Date().toLocaleDateString("es-AR", { dateStyle: "long" })}  ·  ${orders.length} pedido${orders.length !== 1 ? "s" : ""}`;
  sub.font = { size: 10, color: { argb: "FF888888" } };
  sub.alignment = { horizontal: "center" };
  ws.getRow(2).height = 18;

  ws.addRow([]); // row 3 vacío

  // ── Encabezados ──
  const COLS = [
    { header: "N° Pedido",      key: "number",        width: 16 },
    { header: "Fecha",          key: "date",           width: 14 },
    { header: "Canal",          key: "channel",        width: 11 },
    { header: "Cliente",        key: "customer",       width: 24 },
    { header: "Email",          key: "email",          width: 30 },
    { header: "Estado",         key: "status",         width: 14 },
    { header: "Método de pago", key: "paymentMethod",  width: 18 },
    { header: "Estado pago",    key: "paymentStatus",  width: 14 },
    { header: "Subtotal",       key: "subtotal",       width: 14 },
    { header: "Descuento",      key: "discount",       width: 14 },
    { header: "Envío",          key: "shipping",       width: 12 },
    { header: "Total",          key: "total",          width: 14 },
    { header: "Cupón",          key: "coupon",         width: 16 },
    { header: "Productos",      key: "items",          width: 40 },
  ];

  ws.columns = COLS.map((c) => ({ key: c.key, width: c.width }));

  const headerRow = ws.addRow(COLS.map((c) => c.header));
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFDDDDDD" } } };
  });

  // ── Filas de datos ──
  const MONEY_FMT = '"$ "#,##0';
  orders.forEach((o, idx) => {
    const items = (o.items ?? [])
      .map((it: any) => `${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ""} ×${it.quantity}`)
      .join(" | ");

    const row = ws.addRow([
      o.number,
      new Date(o.createdAt).toLocaleDateString("es-AR"),
      o.channel ?? "",
      o.customer?.name ?? "Invitado",
      o.customer?.email ?? "",
      o.status ?? "",
      o.paymentMethod ?? "",
      o.paymentStatus ?? "",
      o.subtotal ?? 0,
      o.discount ?? 0,
      o.shippingCost ?? 0,
      o.total ?? 0,
      o.couponCode ?? "",
      items,
    ]);

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROW_ALT } };
      });
    }

    // Formato moneda en columnas numéricas
    [9, 10, 11, 12].forEach((ci) => {
      row.getCell(ci).numFmt = MONEY_FMT;
    });
  });

  // ── Fila de totales ──
  const grandTotal = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  ws.addRow([]); // separador
  const totRow = ws.addRow(["", "", "", "", "", "", "", "TOTAL GENERAL", 0, 0, 0, grandTotal, "", ""]);
  totRow.height = 20;
  totRow.getCell(8).font = { bold: true, size: 11 };
  totRow.getCell(12).font = { bold: true, size: 11 };
  totRow.getCell(12).numFmt = MONEY_FMT;
  [8, 12].forEach((ci) => {
    totRow.getCell(ci).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_PINK } };
  });

  // ── Descargar ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pettyjoyas-pedidos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminPedidos() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [filters]);

  const { data: orders = [], isLoading } = useAdminOrders(queryString);
  const updateStatus = useUpdateOrderStatus();

  const set = (key: keyof typeof EMPTY_FILTERS) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchOrdersExport(queryString);
      await exportToXLSX(data);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Órdenes online y del local. El cliente recibe un email en cada cambio de estado."
        action={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-outline flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exportando…" : "Exportar XLSX"}
          </button>
        }
      />

      {/* ── Filtros de estado (tabs) ── */}
      <div className="mb-3 flex flex-wrap gap-2">
        {["", ...ORDER_STATUSES].map((t) => (
          <button
            key={t || "todos"}
            onClick={() => setFilters((f) => ({ ...f, estado: t }))}
            className={
              filters.estado === t
                ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium capitalize text-white"
                : "rounded-full border border-line bg-white px-4 py-1.5 text-xs capitalize text-body transition hover:border-ink"
            }
          >
            {t || "Todos"}
          </button>
        ))}
      </div>

      {/* ── Panel de filtros avanzados ── */}
      <div className="mb-5 rounded-2xl border border-line bg-white">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-ink"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted" />
            Filtros avanzados
            {activeCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </span>
          {showFilters ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
        </button>

        {showFilters && (
          <div className="border-t border-line px-5 pb-5 pt-4">
            {/* Fila 1 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Buscar</label>
                <input
                  type="text"
                  placeholder="N° pedido, cliente o email…"
                  value={filters.q}
                  onChange={set("q")}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Canal</label>
                <select
                  value={filters.canal}
                  onChange={set("canal")}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Todos</option>
                  <option value="online">Online</option>
                  <option value="local">Local (POS)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Método de pago</label>
                <select
                  value={filters.metodo_pago}
                  onChange={set("metodo_pago")}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Todos</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m] ?? m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 2 */}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Fecha desde</label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={set("fecha_desde")}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Fecha hasta</label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={set("fecha_hasta")}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Total mínimo ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 10000"
                  value={filters.total_min}
                  onChange={set("total_min")}
                  min={0}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Total máximo ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 100000"
                  value={filters.total_max}
                  onChange={set("total_max")}
                  min={0}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>

            {/* Limpiar filtros */}
            {activeCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" /> Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Resultados ── */}
      {isLoading ? (
        <LoadingScreen label="Cargando pedidos…" />
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">
          No hay pedidos con los filtros seleccionados.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</p>
          <CardGrid>
            {orders.map((o: any) => (
              <div
                key={o.id}
                className="rounded-2xl border border-line bg-white p-5 transition hover:shadow-[0_8px_24px_rgba(1,15,28,0.06)]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{o.number}</p>
                    <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("es-AR")}</p>
                  </div>
                  <Badge className={o.channel === "local" ? "bg-gold-100 text-gold-700" : "bg-blue-50 text-blue-700"}>
                    {o.channel}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 border-t border-line pt-3">
                  <KV label="Cliente">{o.customer?.name ?? "Invitado"}</KV>
                  <KV label="Pago">{PAYMENT_METHOD_LABEL[o.paymentMethod ?? ""] ?? o.paymentMethod ?? "—"}</KV>
                  <KV label="Total"><span className="font-semibold">{formatPrice(o.total)}</span></KV>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
                  <select
                    defaultValue={o.status}
                    onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-medium capitalize outline-none ${ORDER_STATUS_STYLE[o.status] ?? ""}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Link href={`/admin/pedidos/${o.id}`} className="text-xs font-medium text-brand hover:underline">
                    Ver detalle
                  </Link>
                </div>
              </div>
            ))}
          </CardGrid>
        </>
      )}
    </>
  );
}

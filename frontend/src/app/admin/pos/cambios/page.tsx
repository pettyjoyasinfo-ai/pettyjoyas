"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowLeftRight, Check, Loader2, Minus, Plus, Printer, Search, Tag, Trash2, X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { adminApiFetch } from "@/lib/api/client";
import { PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Line = {
  key: string;
  productId: number;
  variantId: string | null;
  name: string;
  variantLabel: string;
  qty: number;
  /** Devuelto: valor que se le reconoce al cliente. Entregado: precio de lista. */
  unitPrice: number;
  /** Solo devueltos: ¿vuelve al stock? */
  restock: boolean;
};

type ExchangeItem = {
  productId: number | null;
  variantId: number | null;
  name: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  restocked: boolean;
};

type Exchange = {
  id: number;
  number: string;
  kind: "cambio" | "devolucion";
  createdAt: string;
  user: string | null;
  originalOrderNumber: string | null;
  reason: string | null;
  notes: string | null;
  returnedTotal: number;
  deliveredTotal: number;
  difference: number;
  settlement: "sin_diferencia" | "cobrado" | "reintegrado" | "saldo_a_favor";
  paymentMethod: string | null;
  returned: ExchangeItem[];
  delivered: ExchangeItem[];
};

type OrderLookup = {
  number: string;
  createdAt: string;
  paymentMethod: string | null;
  total: number;
  items: {
    productId: number; variantId: number | null; name: string; variantLabel: string | null;
    unitPrice: number; bought: number; returnable: number;
  }[];
};

const METHODS = ["efectivo", "tarjeta", "transferencia"] as const;

const SETTLEMENT_LABEL: Record<Exchange["settlement"], string> = {
  sin_diferencia: "Sin diferencia",
  cobrado: "Diferencia cobrada",
  reintegrado: "Reintegrado por caja",
  saldo_a_favor: "Saldo a favor del cliente",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function money(n: number) {
  return n < 0 ? `-${formatPrice(Math.abs(n))}` : formatPrice(n);
}

function errorText(e: unknown) {
  const err = e as { details?: { message?: string; errors?: Record<string, string[]> }; message?: string };
  const first = err?.details?.errors ? Object.values(err.details.errors)[0]?.[0] : null;
  return first ?? err?.details?.message ?? err?.message ?? "No se pudo registrar. Probá de nuevo.";
}

/** Comprobante imprimible: ventana aparte con un HTML mínimo (no depende del estilo del panel). */
function printReceipt(ex: Exchange) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const rows = (items: ExchangeItem[]) =>
    items.map((i) =>
      `<tr><td>${esc(i.name)}${i.variantLabel ? ` · ${esc(i.variantLabel)}` : ""} × ${i.quantity}</td><td class="r">${money(i.unitPrice * i.quantity)}</td></tr>`,
    ).join("");
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${ex.number}</title>
    <style>body{font:13px system-ui,sans-serif;margin:16px;color:#111}h1{font-size:16px;margin:0 0 2px}
    .m{color:#666;font-size:12px;margin-bottom:10px}table{width:100%;border-collapse:collapse;margin:4px 0 10px}
    td{padding:3px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}h2{font-size:12px;text-transform:uppercase;
    letter-spacing:.06em;color:#666;margin:12px 0 0}.t{border-top:1px solid #111;font-weight:600}</style></head><body>
    <h1>Petty Joyas · ${ex.kind === "cambio" ? "Cambio" : "Devolución"} ${ex.number}</h1>
    <div class="m">${fmt(ex.createdAt)}${ex.originalOrderNumber ? ` · Venta ${ex.originalOrderNumber}` : ""}${ex.user ? ` · ${esc(ex.user)}` : ""}</div>
    <h2>Devuelve</h2><table>${rows(ex.returned)}<tr class="t"><td>Total devuelto</td><td class="r">${money(ex.returnedTotal)}</td></tr></table>
    ${ex.delivered.length ? `<h2>Se lleva</h2><table>${rows(ex.delivered)}<tr class="t"><td>Total entregado</td><td class="r">${money(ex.deliveredTotal)}</td></tr></table>` : ""}
    <table><tr class="t"><td>${ex.difference > 0 ? "Diferencia a pagar" : ex.difference < 0 ? "Diferencia a favor del cliente" : "Diferencia"}</td><td class="r">${money(Math.abs(ex.difference))}</td></tr></table>
    <div class="m">${SETTLEMENT_LABEL[ex.settlement]}${ex.paymentMethod ? ` · ${PAYMENT_METHOD_LABEL[ex.paymentMethod] ?? ex.paymentMethod}` : ""}</div>
    ${ex.reason ? `<div class="m">Motivo: ${esc(ex.reason)}</div>` : ""}
    <div class="m">Comprobante interno de cambio · no es una factura.</div>
    <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

// ─── Buscador de productos ───────────────────────────────────────────────────

function ProductPicker({ onPick, placeholder }: {
  onPick: (product: Product, variant: ProductVariant | null) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  const { data: results = [], isFetching } = useQuery<Product[]>({
    queryKey: ["pos", "exchange-search", debounced],
    queryFn: () => adminApiFetch(`/products?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
    staleTime: 20_000,
  });

  function pick(p: Product, v: ProductVariant | null) {
    onPick(p, v);
    setOpen(null);
    setQ("");
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(null); }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brand"
        />
        {isFetching && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />}
      </div>

      {debounced.length >= 2 && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-white">
          {results.length === 0 && !isFetching && <p className="px-4 py-3 text-sm text-muted">Sin resultados.</p>}
          {results.slice(0, 30).map((p) => (
            <div key={p.id} className="border-b border-line last:border-0">
              <button
                type="button"
                onClick={() => (p.variants.length > 0 ? setOpen(open?.id === p.id ? null : p) : pick(p, null))}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-stone-bg"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="text-xs text-muted">
                    {formatPrice(p.price)}
                    {p.variants.length > 0 ? ` · ${p.variants.length} variantes` : ` · stock ${p.stock}`}
                  </span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-brand" />
              </button>
              {open?.id === p.id && (
                <div className="flex flex-wrap gap-1.5 bg-stone-bg px-4 py-3">
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => pick(p, v)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
                    >
                      {v.label} <span className="text-muted">· {v.stock}u</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Renglones ───────────────────────────────────────────────────────────────

function LineRow({ line, kind, onChange, onRemove }: {
  line: Line;
  kind: "in" | "out";
  onChange: (patch: Partial<Line>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{line.name}</p>
          {line.variantLabel && <p className="text-xs text-muted">{line.variantLabel}</p>}
        </div>
        <button type="button" onClick={onRemove} aria-label="Quitar" className="text-muted hover:text-red-500">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onChange({ qty: Math.max(1, line.qty - 1) })}
            className="grid h-7 w-7 place-items-center rounded-lg border border-line hover:border-brand"><Minus className="h-3 w-3" /></button>
          <span className="w-6 text-center text-sm font-medium">{line.qty}</span>
          <button type="button" onClick={() => onChange({ qty: line.qty + 1 })}
            className="grid h-7 w-7 place-items-center rounded-lg border border-line hover:border-brand"><Plus className="h-3 w-3" /></button>
        </div>
        {kind === "in" ? (
          <label className="flex items-center gap-1.5 text-xs text-body">
            Valor c/u
            <input
              inputMode="numeric"
              value={line.unitPrice}
              onChange={(e) => onChange({ unitPrice: Math.max(0, Math.round(Number(e.target.value.replace(/\D/g, "")) || 0)) })}
              className="w-24 rounded-lg border border-line px-2 py-1 text-right text-sm outline-none focus:border-brand"
            />
          </label>
        ) : (
          <span className="text-xs text-body">Precio c/u <strong className="text-ink">{formatPrice(line.unitPrice)}</strong></span>
        )}
        <span className="ml-auto text-sm font-semibold text-ink">{formatPrice(line.unitPrice * line.qty)}</span>
      </div>
      {kind === "in" && (
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-body">
          <input type="checkbox" checked={line.restock} onChange={(e) => onChange({ restock: e.target.checked })}
            className="mt-0.5 h-3.5 w-3.5 accent-brand" />
          <span>
            Vuelve al stock <span className="text-muted">(apta para reventa)</span>
            {!line.restock && <span className="block text-amber-700">No se suma al stock: queda registrada como no apta.</span>}
          </span>
        </label>
      )}
    </li>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function PosCambiosPage() {
  const qc = useQueryClient();

  const [returned, setReturned] = useState<Line[]>([]);
  const [delivered, setDelivered] = useState<Line[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  const [method, setMethod] = useState<(typeof METHODS)[number]>("efectivo");
  const [negative, setNegative] = useState<"saldo_a_favor" | "reintegro">("saldo_a_favor");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Exchange | null>(null);

  const { data: register } = useQuery<{ id?: number } | null>({
    queryKey: ["pos", "cash-register", "current-for-exchange"],
    queryFn: () => adminApiFetch("/pos/cash-register/current"),
    staleTime: 15_000,
  });
  const registerOpen = !!register?.id;

  const { data: history = [] } = useQuery<Exchange[]>({
    queryKey: ["pos", "exchanges"],
    queryFn: async () => {
      const r = await adminApiFetch<{ data: Exchange[] } | Exchange[]>("/pos/exchanges?limit=50");
      return Array.isArray(r) ? r : r.data;
    },
    staleTime: 15_000,
  });

  const returnedTotal = returned.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const deliveredTotal = delivered.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const difference = deliveredTotal - returnedTotal;
  const movesCash = difference > 0 || (difference < 0 && negative === "reintegro");

  function addLine(set: typeof setReturned, kind: "in" | "out", p: Product, v: ProductVariant | null) {
    const key = `${p.id}-${v?.id ?? 0}`;
    const price = p.price + (v?.priceDelta ?? 0);
    set((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found) return ls.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, {
        key, productId: Number(p.id), variantId: v?.id ?? null, name: p.name,
        variantLabel: v?.label ?? "", qty: 1, unitPrice: price, restock: kind === "in",
      }];
    });
  }

  function patchLine(set: typeof setReturned, key: string, patch: Partial<Line>) {
    set((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function lookupOrder() {
    if (!orderNumber.trim()) return;
    setOrderLoading(true);
    setOrderError("");
    setOrder(null);
    try {
      const o = await adminApiFetch<OrderLookup>(`/pos/exchanges/order/${encodeURIComponent(orderNumber.trim())}`);
      setOrder(o);
    } catch (e) {
      setOrderError(errorText(e));
    } finally {
      setOrderLoading(false);
    }
  }

  function returnFromOrder(it: OrderLookup["items"][number]) {
    const key = `${it.productId}-${it.variantId ?? 0}`;
    setReturned((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found) return ls.map((l) => (l.key === key ? { ...l, qty: Math.min(it.returnable, l.qty + 1) } : l));
      return [...ls, {
        key, productId: it.productId, variantId: it.variantId ? String(it.variantId) : null, name: it.name,
        variantLabel: it.variantLabel ?? "", qty: 1, unitPrice: it.unitPrice, restock: true,
      }];
    });
  }

  const submit = useMutation({
    mutationFn: () => {
      const body = {
        original_order_number: order ? order.number : null,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
        returned: returned.map((l) => ({
          product_id: l.productId, product_variant_id: l.variantId ? Number(l.variantId) : null,
          quantity: l.qty, unit_price: l.unitPrice, restock: l.restock,
        })),
        delivered: delivered.map((l) => ({
          product_id: l.productId, product_variant_id: l.variantId ? Number(l.variantId) : null, quantity: l.qty,
        })),
        payment_method: movesCash ? method : null,
        negative_settlement: difference < 0 ? negative : null,
      };
      return adminApiFetch<{ data: Exchange } | Exchange>("/pos/exchanges", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: (r) => {
      setDone("data" in r ? r.data : r);
      setReturned([]); setDelivered([]); setOrder(null); setOrderNumber(""); setReason(""); setNotes(""); setError("");
      qc.invalidateQueries({ queryKey: ["pos"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => setError(errorText(e)),
  });

  const canSubmit = returned.length > 0 && !submit.isPending && (!movesCash || registerOpen);

  return (
    <>
      <PageHeader
        title="Cambios y devoluciones"
        description="Registrá lo que vuelve y lo que se lleva el cliente. No cuenta como una venta nueva: en caja solo entra o sale la diferencia."
        action={
          <Link href="/admin/pos" className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al POS
          </Link>
        }
      />

      {!registerOpen && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          La caja está cerrada. Podés registrar cambios sin diferencia de dinero o con saldo a favor; para cobrar o reintegrar una diferencia primero abrí la caja en el POS.
        </p>
      )}

      {done && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-green-800">
                <Check className="h-4 w-4" /> {done.kind === "cambio" ? "Cambio" : "Devolución"} {done.number} registrado
              </p>
              <p className="mt-1 text-sm text-green-800">
                {SETTLEMENT_LABEL[done.settlement]}
                {done.difference !== 0 && <> · <strong>{money(Math.abs(done.difference))}</strong></>}
                {done.paymentMethod && <> · {PAYMENT_METHOD_LABEL[done.paymentMethod] ?? done.paymentMethod}</>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => printReceipt(done)}
                className="flex items-center gap-1.5 rounded-xl border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100">
                <Printer className="h-3.5 w-3.5" /> Comprobante
              </button>
              <button type="button" onClick={() => setDone(null)} aria-label="Cerrar" className="text-green-700 hover:text-green-900"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {done.returned.some((i) => i.restocked) && (
            <div className="mt-3 border-t border-green-200 pt-3">
              <p className="mb-2 text-xs font-medium text-green-800">Etiquetas de lo que volvió al stock:</p>
              <div className="flex flex-wrap gap-2">
                {done.returned.filter((i) => i.restocked).map((i, n) => (
                  <Link key={n} href={`/admin/etiquetas?buscar=${encodeURIComponent(i.name)}`}
                    className="flex items-center gap-1.5 rounded-full border border-green-300 bg-white px-3 py-1 text-xs text-green-800 hover:bg-green-100">
                    <Tag className="h-3 w-3" /> {i.name}{i.variantLabel ? ` · ${i.variantLabel}` : ""}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card title="1 · Lo que devuelve el cliente">
            <div className="mb-4 rounded-xl bg-stone-bg p-3">
              <p className="mb-2 text-xs font-medium text-ink">
                Número de venta <span className="font-normal text-muted">(opcional)</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupOrder()}
                  placeholder="Ej: PJ-000123 o 123"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button type="button" onClick={lookupOrder} disabled={orderLoading || !orderNumber.trim()}
                  className="btn-outline px-3 py-2 text-xs disabled:opacity-50">
                  {orderLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
                </button>
              </div>
              {orderError && <p className="mt-2 text-xs text-red-600">{orderError}</p>}
              {order && (
                <div className="mt-3">
                  <p className="mb-1.5 flex items-center justify-between text-xs text-body">
                    <span>Venta <strong className="text-ink">{order.number}</strong> · {fmt(order.createdAt)}</span>
                    <button type="button" onClick={() => setOrder(null)} className="text-muted hover:text-red-500">Quitar</button>
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {order.items.map((it, n) => (
                      <li key={n} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                        <span className="min-w-0 truncate">
                          {it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ""}
                          <span className="text-muted"> · {formatPrice(it.unitPrice)} · se pueden devolver {it.returnable}</span>
                        </span>
                        <button type="button" disabled={it.returnable === 0} onClick={() => returnFromOrder(it)}
                          className="shrink-0 rounded-full border border-line px-2.5 py-1 font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-40">
                          Devolver
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <ProductPicker
              placeholder="Buscar el artículo que devuelve…"
              onPick={(p, v) => addLine(setReturned, "in", p, v)}
            />

            {returned.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2.5">
                {returned.map((l) => (
                  <LineRow key={l.key} line={l} kind="in"
                    onChange={(patch) => patchLine(setReturned, l.key, patch)}
                    onRemove={() => setReturned((ls) => ls.filter((x) => x.key !== l.key))} />
                ))}
              </ul>
            )}
          </Card>

          <Card title="2 · Lo que se lleva el cliente">
            <p className="mb-3 text-xs text-muted">Dejalo vacío si es solo una devolución.</p>
            <ProductPicker
              placeholder="Buscar el artículo que se lleva…"
              onPick={(p, v) => addLine(setDelivered, "out", p, v)}
            />
            {delivered.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2.5">
                {delivered.map((l) => (
                  <LineRow key={l.key} line={l} kind="out"
                    onChange={(patch) => patchLine(setDelivered, l.key, patch)}
                    onRemove={() => setDelivered((ls) => ls.filter((x) => x.key !== l.key))} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="3 · Resolución">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-body">Devuelve</dt><dd className="font-medium text-ink">{formatPrice(returnedTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-body">Se lleva</dt><dd className="font-medium text-ink">{formatPrice(deliveredTotal)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-medium text-ink">
                  {difference > 0 ? "El cliente paga" : difference < 0 ? "A favor del cliente" : "Diferencia"}
                </dt>
                <dd className={`text-lg font-semibold ${difference > 0 ? "text-brand" : "text-ink"}`}>{formatPrice(Math.abs(difference))}</dd>
              </div>
            </dl>

            {returned.length > 0 && difference === 0 && (
              <p className="mt-3 rounded-xl bg-stone-bg px-4 py-3 text-sm text-body">Mismo valor: no se mueve dinero en caja.</p>
            )}

            {difference < 0 && (
              <fieldset className="mt-4">
                <legend className="mb-2 text-xs font-medium text-ink">¿Cómo se resuelve la diferencia?</legend>
                <label className="mb-2 flex cursor-pointer items-start gap-2 text-sm">
                  <input type="radio" name="neg" checked={negative === "saldo_a_favor"} onChange={() => setNegative("saldo_a_favor")} className="mt-1 accent-brand" />
                  <span>Saldo a favor del cliente <span className="block text-xs text-muted">Queda anotado en el comprobante; no sale plata de caja.</span></span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input type="radio" name="neg" checked={negative === "reintegro"} onChange={() => setNegative("reintegro")} className="mt-1 accent-brand" />
                  <span>Reintegrar por caja <span className="block text-xs text-muted">Resta de la caja con el medio que elijas. Recordá que la política es solo cambios, sin reintegros.</span></span>
                </label>
              </fieldset>
            )}

            {movesCash && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-ink">
                  {difference > 0 ? "Medio con el que paga la diferencia" : "Medio con el que se reintegra"}
                </p>
                <div className="flex gap-2">
                  {METHODS.map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${method === m ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
                      {PAYMENT_METHOD_LABEL[m] ?? m}
                    </button>
                  ))}
                </div>
                {!registerOpen && <p className="mt-2 text-xs text-amber-700">Abrí la caja en el POS para registrar este movimiento de dinero.</p>}
              </div>
            )}

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Motivo <span className="font-normal text-muted">(opcional)</span></span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: talle equivocado, falla de fábrica"
                className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            </label>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Notas <span className="font-normal text-muted">(opcional)</span></span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            </label>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

            <button type="button" onClick={() => { setError(""); submit.mutate(); }} disabled={!canSubmit}
              className="btn-brand mt-5 w-full py-3 text-sm disabled:opacity-50">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
              Registrar {delivered.length > 0 ? "cambio" : "devolución"}
            </button>
            {returned.length === 0 && <p className="mt-2 text-center text-xs text-muted">Agregá al menos el artículo que devuelve el cliente.</p>}
          </Card>

          <Card title="Historial reciente">
            {history.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay cambios ni devoluciones registrados.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {history.map((ex) => (
                  <li key={ex.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        {ex.number}
                        <Badge className={ex.kind === "cambio" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                          {ex.kind === "cambio" ? "Cambio" : "Devolución"}
                        </Badge>
                      </span>
                      <span className="text-xs text-muted">{fmt(ex.createdAt)}{ex.user ? ` · ${ex.user}` : ""}</span>
                    </div>
                    <p className="mt-1 text-xs text-body">
                      <span className="text-muted">Devolvió:</span> {ex.returned.map((i) => `${i.name}${i.variantLabel ? ` ${i.variantLabel}` : ""} ×${i.quantity}${i.restocked ? "" : " (no apta)"}`).join(", ")}
                    </p>
                    {ex.delivered.length > 0 && (
                      <p className="text-xs text-body">
                        <span className="text-muted">Se llevó:</span> {ex.delivered.map((i) => `${i.name}${i.variantLabel ? ` ${i.variantLabel}` : ""} ×${i.quantity}`).join(", ")}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-body">
                        {SETTLEMENT_LABEL[ex.settlement]}
                        {ex.difference !== 0 && <> · <strong className="text-ink">{money(Math.abs(ex.difference))}</strong></>}
                        {ex.paymentMethod && <> · {PAYMENT_METHOD_LABEL[ex.paymentMethod] ?? ex.paymentMethod}</>}
                        {ex.originalOrderNumber && <> · venta {ex.originalOrderNumber}</>}
                      </span>
                      <button type="button" onClick={() => printReceipt(ex)} className="flex items-center gap-1 text-xs text-muted hover:text-brand">
                        <Printer className="h-3 w-3" /> Comprobante
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

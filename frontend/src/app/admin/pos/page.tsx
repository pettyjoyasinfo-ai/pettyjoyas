"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  CreditCard,
  Eye,
  History,
  Keyboard,
  Landmark,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Tag,
  Trash2,
  UserCheck,
  WifiOff,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { adminApiFetch, apiFetch } from "@/lib/api/client";
import { enqueueEvent } from "@/lib/offline/db";
import { syncOutbox } from "@/lib/offline/sync";
import { formatPrice } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type Variant = { id: string; label: string; stock: number; priceDelta: number };

type ProductResult = {
  id: number;
  name: string;
  price: number;
  images: string[];
  stock: number;
  variants: Variant[];
  // Presente solo en /products/lookup: si el código escaneado era el de una
  // variante puntual, acá viene su id para agregarla directo, sin preguntar.
  matchedVariantId?: string | null;
};

type TicketItem = {
  productId: number;
  variantId: string | null;
  name: string;
  variantLabel: string;
  unitPrice: number;
  qty: number;
  imageUrl: string;
};

type CashRegister = {
  id: number;
  status: "open" | "closed";
  opened_at: string;
  opening_amount: number;
  opened_by: string;
  summary: {
    efectivo: { count: number; total: number };
    transferencia: { count: number; total: number };
    tarjeta: { count: number; total: number };
    total: number;
    count: number;
  };
};

type TransferInfo = { alias: string; cbu: string; bank: string; holder: string };
type DailySummary = {
  efectivo: { count: number; total: number };
  transferencia: { count: number; total: number };
  tarjeta: { count: number; total: number };
};
type PayMode = "efectivo" | "transferencia" | "tarjeta";
type LinkedCustomer = { id: number; name: string; email: string; vip: boolean };

// ─── Print helper ──────────────────────────────────────────────────────────

function doPrint(items: TicketItem[], subtotal: number, discount: number, total: number, payMode: string) {
  const w = window.open("", "", "width=380,height=680,toolbar=0,menubar=0");
  if (!w) return;
  const now = new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const rows = items.map(t =>
    `<tr><td>${t.name}${t.variantLabel ? ` (${t.variantLabel})` : ""} x${t.qty}</td><td align="right">$${(t.unitPrice * t.qty).toLocaleString("es-AR")}</td></tr>`
  ).join("");
  // Ventana de vista previa: el botón dispara el diálogo de impresión nativo,
  // que en Chrome/Edge permite elegir "Guardar como PDF" como destino.
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page{size:80mm auto;margin:0}
  body{font-family:'Courier New',monospace;font-size:11px;background:#e8e8e8;margin:0;padding:20px 0;display:flex;flex-direction:column;align-items:center;gap:14px}
  .receipt{width:72mm;padding:4mm;margin:0;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.2)}
  h1{font-size:14px;text-align:center;margin:0 0 2px}
  p{text-align:center;font-size:9px;margin:2px 0}
  table{width:100%;border-collapse:collapse}
  td{padding:2px 0;font-size:11px}
  .dashed{border-top:1px dashed #000;margin:5px 0}
  .big{font-size:13px;font-weight:bold}
  .no-print{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#821f40;color:#fff;border:0;border-radius:10px;padding:12px 28px;font-size:13px;font-weight:600;cursor:pointer}
  @media print{ body{background:#fff;padding:0} .receipt{box-shadow:none} .no-print{display:none} }
</style></head><body>
<div class="receipt">
<h1>PETTY JOYAS</h1>
<p>${now}</p>
<div class="dashed"></div>
<table>${rows}</table>
<div class="dashed"></div>
<table>
  ${discount > 0 ? `<tr><td>Subtotal</td><td align="right">$${subtotal.toLocaleString("es-AR")}</td></tr><tr><td>Descuento</td><td align="right">-$${discount.toLocaleString("es-AR")}</td></tr>` : ""}
  <tr class="big"><td>TOTAL</td><td align="right">$${total.toLocaleString("es-AR")}</td></tr>
  <tr><td>Forma de pago</td><td align="right">${payMode}</td></tr>
</table>
<div class="dashed"></div>
<p>¡Gracias por tu compra!</p>
</div>
<button class="no-print" onclick="window.print()">Imprimir / Guardar como PDF</button>
</body></html>`);
  w.document.close();
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AdminPOS() {
  const qc = useQueryClient();
  const router = useRouter();
  // ── online/offline ──
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncCount, setSyncCount] = useState(0);

  useEffect(() => {
    const on = async () => {
      setIsOnline(true);
      const { synced } = await syncOutbox();
      if (synced > 0) setSyncCount(c => c + synced);
    };
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    // Sync any events queued in a prior offline session
    void syncOutbox().then(({ synced }) => { if (synced > 0) setSyncCount(synced); });
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── cash register ──
  const { data: cashReg, isLoading: regLoading } = useQuery<CashRegister | null>({
    queryKey: ["pos", "cash-register"],
    queryFn:  () => adminApiFetch("/pos/cash-register/current"),
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  // ── skip cash register (persiste en sessionStorage para no reaparecer al navegar) ──
  const [skipCaja, setSkipCaja] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("pos-skip-caja") === "1"
  );

  // Al omitir la caja igual se abre una sesión en $0 "por detrás" (sin pedirle
  // nada al usuario) para que las ventas queden en el Historial de cajas.
  async function handleSkipCaja() {
    sessionStorage.setItem("pos-skip-caja", "1");
    setSkipCaja(true);
    try {
      await adminApiFetch("/pos/cash-register/open", {
        method: "POST",
        body: JSON.stringify({ opening_amount: 0, notes: "Sesión sin caja (omitida)" }),
      });
      void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] });
    } catch {
      // el POS sigue funcionando en modo "sin caja" aunque falle el registro en segundo plano
    }
  }

  // Cierra sola la sesión en $0 (sin pedir conteo de efectivo) y vuelve a la pantalla inicial.
  async function handleEndSession() {
    try {
      if (cashReg) {
        const expected = cashReg.opening_amount + cashReg.summary.efectivo.total;
        await adminApiFetch("/pos/cash-register/close", {
          method: "POST",
          body: JSON.stringify({ closing_amount: expected, notes: "Sesión sin caja (omitida)" }),
        });
        void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] });
        void qc.invalidateQueries({ queryKey: ["pos", "daily-summary"] });
      }
    } catch {
      // igual volvemos a la pantalla inicial aunque falle el cierre en segundo plano
    } finally {
      sessionStorage.removeItem("pos-skip-caja");
      setSkipCaja(false);
    }
  }

  // ── daily summary ──
  const { data: daily } = useQuery<DailySummary>({
    queryKey: ["pos", "daily-summary"],
    queryFn:  () => adminApiFetch("/pos/daily-summary"),
    refetchInterval: 30_000,
    enabled: !!cashReg || skipCaja,
  });

  // ── transfer info ──
  const { data: transferInfo } = useQuery<TransferInfo>({
    queryKey: ["pos", "transfer-info"],
    queryFn:  () => apiFetch("/payments/transfer-info"),
    staleTime: Infinity,
  });

  // ── product search ──
  const [searchQuery, setSearchQuery]   = useState("");
  const [debouncedQ,  setDebouncedQ]    = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const {
    data: productSearch,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery<ProductResult[]>({
    queryKey: ["pos", "search", debouncedQ],
    queryFn:  () => adminApiFetch(`/products?q=${encodeURIComponent(debouncedQ)}`),
    enabled:  debouncedQ.length >= 2,
    staleTime: 20_000,
  });

  const searchResults = productSearch ?? [];

  // ── variant picker ──
  const [pendingProduct, setPendingProduct] = useState<ProductResult | null>(null);

  // ── ticket ──
  const [ticket, setTicket] = useState<TicketItem[]>([]);

  function addToTicket(product: ProductResult, variant: Variant | null = null) {
    const id      = variant ? variant.id : null;
    const price   = product.price + (variant?.priceDelta ?? 0);
    const label   = variant?.label ?? "";
    const img     = product.images[0] ?? "";
    setTicket(prev => {
      const idx = prev.findIndex(t => t.productId === product.id && t.variantId === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: product.id, variantId: id, name: product.name, variantLabel: label, unitPrice: price, qty: 1, imageUrl: img }];
    });
    setSearchQuery("");
    setPendingProduct(null);
    searchRef.current?.focus();
  }

  function changeQty(idx: number, delta: number) {
    setTicket(prev => {
      const next = [...prev];
      const newQty = next[idx].qty + delta;
      if (newQty <= 0) { next.splice(idx, 1); return next; }
      next[idx] = { ...next[idx], qty: newQty };
      return next;
    });
  }

  // ── coupon ──
  const [couponInput,   setCouponInput]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError,   setCouponError]   = useState("");

  const validateCoupon = useMutation({
    mutationFn: (subtotal: number) =>
      apiFetch<{ discount: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal }),
      }),
    onSuccess: (res) => {
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discount: res.discount });
      setCouponError("");
    },
    onError: () => setCouponError("Cupón inválido o vencido"),
  });

  // ── customer ──
  const [customerEmail, setCustomerEmail]   = useState("");
  const [linkedCustomer, setLinkedCustomer] = useState<LinkedCustomer | null>(null);
  const [customerError,  setCustomerError]  = useState("");

  const linkCustomer = useMutation({
    mutationFn: () =>
      adminApiFetch<{ data: LinkedCustomer[] }>(`/customers?q=${encodeURIComponent(customerEmail)}&per_page=1`),
    onSuccess: (res) => {
      const c = res.data?.[0];
      if (c && c.email.toLowerCase() === customerEmail.toLowerCase()) {
        setLinkedCustomer(c);
        setCustomerError("");
      } else {
        setCustomerError("Cliente no encontrado");
      }
    },
  });

  // ── payment ──
  const [payMode, setPayMode] = useState<PayMode>("efectivo");
  const [copied,  setCopied]  = useState("");

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2000); });
  }

  // ── totals ──
  const subtotal = ticket.reduce((s, t) => s + t.unitPrice * t.qty, 0);
  const discount = appliedCoupon?.discount ?? 0;
  const total    = Math.max(0, subtotal - discount);

  // ── barcode/QR scan — funciona en cualquier parte de la pantalla, sin
  // necesidad de hacer foco en el buscador (ver listener global más abajo) ──
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleBarcodeScanned(code: string) {
    try {
      const p = await adminApiFetch<ProductResult>(`/products/lookup?barcode=${encodeURIComponent(code)}`);
      // El código escaneado era el de una variante puntual (ej. un talle):
      // se agrega directo, sin preguntar cuál es.
      if (p.matchedVariantId) {
        const variant = p.variants.find(v => v.id === p.matchedVariantId);
        if (variant) {
          addToTicket(p, variant);
          setScanFeedback({ ok: true, text: `${p.name}${variant.label ? " · " + variant.label : ""}` });
          return;
        }
      }
      // Código a nivel producto pero tiene variantes: ahí sí hace falta elegir.
      if (p.variants.length > 0) {
        setPendingProduct(p);
        setScanFeedback({ ok: true, text: `${p.name} — elegí la variante` });
        return;
      }
      addToTicket(p);
      setScanFeedback({ ok: true, text: p.name });
    } catch {
      setScanFeedback({ ok: false, text: `Código "${code}" no encontrado` });
    } finally {
      setTimeout(() => setScanFeedback(null), 2500);
    }
  }

  // ── confirm sale ──
  const [saleSuccess, setSaleSuccess] = useState<{ orderNumber: string; offlineId?: string } | null>(null);
  const [saleError,   setSaleError]   = useState("");

  const confirmSaleMutation = useMutation({
    mutationFn: () =>
      adminApiFetch<{ order: { id: string; number: string }; payment: Record<string, unknown> | null }>("/pos/sales", {
        method: "POST",
        body: JSON.stringify({
          channel: "local",
          items: ticket.map(t => ({ product_id: t.productId, product_variant_id: t.variantId, quantity: t.qty })),
          customer: linkedCustomer ? { email: linkedCustomer.email, name: linkedCustomer.name } : undefined,
          coupon_code: appliedCoupon?.code,
          payment_method: payMode,
        }),
      }),
    onSuccess: (res) => {
      setSaleError("");
      setSaleSuccess({ orderNumber: res.order.number });
      void qc.invalidateQueries({ queryKey: ["pos", "daily-summary"] });
      void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] });
    },
    onError: (e: Error) => setSaleError(e.message || "No se pudo registrar la venta"),
  });

  async function handleConfirmSale() {
    if (ticket.length === 0) return;
    setSaleError("");

    if (!isOnline) {
      const eventId = await enqueueEvent("SALE_CREATED", {
        channel: "local",
        items: ticket.map(t => ({ product_id: t.productId, product_variant_id: t.variantId, quantity: t.qty })),
        customer: linkedCustomer ? { email: linkedCustomer.email } : undefined,
        coupon_code: appliedCoupon?.code,
        payment_method: payMode,
      });
      setSaleSuccess({ orderNumber: "OFFLINE", offlineId: eventId.id });
      setSyncCount(c => c + 1);
      return;
    }
    confirmSaleMutation.mutate();
  }

  // abre la vista previa del comprobante en una pestaña aparte (desde ahí se imprime o se guarda como PDF)
  function handleViewReceipt() {
    doPrint(ticket, subtotal, discount, total, payMode);
  }

  // limpia el ticket y arranca una venta nueva
  function afterSale() {
    setTicket([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setLinkedCustomer(null);
    setCustomerEmail("");
    setSaleSuccess(null);
    setPayMode("efectivo");
  }

  // ── open / close cash register ──
  const [openAmount, setOpenAmount]       = useState(0);
  const [closeAmount, setCloseAmount]     = useState(0);
  const [closeNotes,  setCloseNotes]      = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeSummary, setCloseSummary]   = useState<null | { summary: CashRegister["summary"]; expected: number; diff: number; closing_amount: number }>(null);

  const openCaja = useMutation({
    mutationFn: () =>
      adminApiFetch("/pos/cash-register/open", {
        method: "POST",
        body: JSON.stringify({ opening_amount: openAmount }),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] }); setOpenAmount(0); },
  });

  const closeCaja = useMutation({
    mutationFn: () =>
      adminApiFetch<{ summary: CashRegister["summary"]; expected: number; diff: number; closing_amount: number }>(
        "/pos/cash-register/close",
        { method: "POST", body: JSON.stringify({ closing_amount: closeAmount, notes: closeNotes }) }
      ),
    onSuccess: (res) => {
      setCloseSummary(res);
      void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] });
      void qc.invalidateQueries({ queryKey: ["pos", "daily-summary"] });
    },
  });

  // ── atajos de teclado (ver listener global más abajo) ──
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ── credit note ──
  const [showCreditNote, setShowCreditNote] = useState(false);
  const [cnOrderNum,  setCnOrderNum]  = useState("");
  const [cnReason,    setCnReason]    = useState("");
  const [cnAmount,    setCnAmount]    = useState(0);
  const [cnSuccess,   setCnSuccess]   = useState("");
  const [cnError,     setCnError]     = useState("");

  const creditNote = useMutation({
    mutationFn: () =>
      adminApiFetch<{ number: string }>("/pos/credit-notes", {
        method: "POST",
        body: JSON.stringify({ order_number: cnOrderNum.trim(), reason: cnReason.trim(), amount: cnAmount }),
      }),
    onSuccess: (res) => { setCnSuccess(res.number); setCnError(""); },
    onError: (e: Error) => { setCnError(e.message || "Error al emitir nota de crédito"); setCnSuccess(""); },
  });

  // ── captura global de scanner + atajos de teclado (ver tabla en el header) ──
  useEffect(() => {
    let buffer = "";

    function isForeignEditable(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      if (target === searchRef.current) return false;
      return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Atajos con tecla de función: funcionan siempre, incluso con foco en otro campo.
      if (e.key === "Escape") {
        if (pendingProduct) setPendingProduct(null);
        else if (saleSuccess) afterSale();
        else if (showCreditNote) setShowCreditNote(false);
        else if (showCloseModal) setShowCloseModal(false);
        else if (showShortcuts) setShowShortcuts(false);
        return;
      }
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "F4") { e.preventDefault(); void handleConfirmSale(); return; }
      if (e.key === "F7") {
        e.preventDefault();
        setPayMode(p => (p === "efectivo" ? "transferencia" : p === "transferencia" ? "tarjeta" : "efectivo"));
        return;
      }
      if (e.key === "F8") { e.preventDefault(); setShowCreditNote(true); return; }
      if (e.key === "F9") { e.preventDefault(); router.push("/admin/pos/historial"); return; }

      // A partir de acá: nada de esto debe interferir si el cajero está
      // escribiendo en OTRO campo (email de cliente, cupón, nota de crédito…).
      if (isForeignEditable(e.target)) { buffer = ""; return; }

      if (e.key === "+" || e.key === "-") {
        e.preventDefault();
        setTicket(prev => {
          if (prev.length === 0) return prev;
          const idx = prev.length - 1;
          const newQty = prev[idx].qty + (e.key === "+" ? 1 : -1);
          const next = [...prev];
          if (newQty <= 0) { next.splice(idx, 1); return next; }
          next[idx] = { ...next[idx], qty: newQty };
          return next;
        });
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        setTicket(prev => prev.slice(0, -1));
        return;
      }
      if (e.key === "Tab") { buffer = ""; return; }

      // Captura del scanner: acumula lo tipeado y dispara al llegar el Enter
      // que la pistola manda automáticamente al final de cada lectura.
      if (e.key === "Enter") {
        const code = buffer.trim();
        buffer = "";
        if (/^\d{4,}$/.test(code)) {
          e.preventDefault();
          void handleBarcodeScanned(code);
        }
        return;
      }
      if (e.key === "Backspace") { buffer = buffer.slice(0, -1); return; }
      if (e.key.length === 1) buffer += e.key;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingProduct, saleSuccess, showCreditNote, showCloseModal, showShortcuts]);

  // ─── Loading / Abrir caja ────────────────────────────────────────────────

  if (regLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!cashReg && !skipCaja) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50">
          <Banknote className="h-8 w-8 text-brand" />
        </div>
        <div>
          <h2 className="font-display text-2xl text-ink">Apertura de caja</h2>
          <p className="mt-1 max-w-xs text-sm text-body">Ingresá el efectivo inicial para comenzar la jornada.</p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-ink">Efectivo en cajón (pesos)</label>
          <div className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5">
            <span className="text-sm text-muted">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={openAmount || ""}
              onChange={e => setOpenAmount(Number(e.target.value))}
              placeholder="0"
              className="flex-1 bg-transparent text-right text-sm outline-none"
              autoFocus
            />
          </div>
        </div>
        <button
          onClick={() => openCaja.mutate()}
          disabled={openCaja.isPending}
          className="btn-brand flex w-full max-w-xs items-center justify-center gap-2 py-2.5"
        >
          {openCaja.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
          Abrir caja {openAmount > 0 && `· ${formatPrice(openAmount)}`}
        </button>
        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-muted">o</span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <button
            onClick={handleSkipCaja}
            className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Continuar sin caja
          </button>
        </div>
        <Link href="/admin/pos/historial" className="text-xs text-muted hover:text-brand underline-offset-2 hover:underline">
          Ver historial de cajas
        </Link>
      </div>
    );
  }

  // ─── Main POS ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-amber-800">Sin conexión — modo offline activo</p>
            <p className="text-[11px] text-amber-700">Las ventas se guardan en el dispositivo y se sincronizan al volver la conexión.</p>
          </div>
        </div>
      )}

      {syncCount > 0 && isOnline && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <RefreshCw className="h-4 w-4 shrink-0 text-green-700" />
          <p className="text-xs text-green-800">{syncCount} {syncCount === 1 ? "venta sincronizada" : "ventas sincronizadas"} con el servidor.</p>
          <button onClick={() => setSyncCount(0)} className="ml-auto text-green-600 hover:text-green-800"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <PageHeader
        title="Venta presencial"
        description={cashReg && !skipCaja
          ? `Caja abierta por ${cashReg.opened_by} — ${new Date(cashReg.opened_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
          : "Sin caja abierta"
        }
        action={
          <div className="flex items-center gap-2">
            {isOnline
              ? <Badge className="bg-green-50 text-green-700"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online</span></Badge>
              : <Badge className="bg-amber-50 text-amber-700"><span className="flex items-center gap-1.5"><WifiOff className="h-3 w-3" /> Offline</span></Badge>
            }
            <Link href="/admin/pos/ventas" className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
              <ClipboardList className="h-3.5 w-3.5" /> Ventas
            </Link>
            <Link href="/admin/pos/historial" className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand">
              <History className="h-3.5 w-3.5" /> Historial
            </Link>
            <button
              onClick={() => setShowShortcuts(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
              title="Atajos de teclado"
            >
              <Keyboard className="h-3.5 w-3.5" /> Atajos
            </button>
            <button
              onClick={() => setShowCreditNote(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
            >
              <ClipboardList className="h-3.5 w-3.5" /> Nota de crédito
            </button>
            {cashReg && !skipCaja && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Cerrar caja
              </button>
            )}
          </div>
        }
      />

      {/* Daily summary */}
      <div className="mb-5 grid grid-cols-3 gap-4">
        {(["efectivo", "transferencia", "tarjeta"] as const).map(key => {
          const row = daily?.[key];
          const colors = { efectivo: "text-green-700 bg-green-50", transferencia: "text-blue-700 bg-blue-50", tarjeta: "text-brand bg-brand-50" };
          const labels = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta" };
          return (
            <div key={key} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-500">{labels[key]} hoy</p>
              <p className="mt-1 text-xl font-semibold text-ink">{row ? formatPrice(row.total) : "—"}</p>
              {row && (
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[key]}`}>
                  {row.count} {row.count === 1 ? "venta" : "ventas"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Ticket + cobro — panel dominante: es lo que se mira todo el rato */}
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card title="Ticket actual" padded={false}>
            {ticket.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">El ticket está vacío — escaneá un producto para empezar</p>
            ) : (
              <ul className="divide-y divide-line">
                {ticket.map((t, idx) => (
                  <li key={`${t.productId}-${t.variantId}`} className="flex items-center gap-4 px-5 py-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-bg">
                      {t.imageUrl && <Image src={t.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-ink">{t.name}</p>
                      {t.variantLabel && <p className="text-sm text-muted">{t.variantLabel}</p>}
                      <p className="text-sm text-body">{formatPrice(t.unitPrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(idx, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-red-300 hover:text-red-500">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-base font-medium">{t.qty}</span>
                      <button onClick={() => changeQty(idx, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-brand hover:text-brand">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="w-24 shrink-0 text-right text-base font-semibold text-ink">{formatPrice(t.unitPrice * t.qty)}</p>
                    <button onClick={() => setTicket(prev => prev.filter((_, i) => i !== idx))} className="text-muted hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 gap-4 border-t border-line p-5 text-sm sm:grid-cols-2">
              {/* Customer */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink">Cliente <span className="font-normal text-muted">(opcional)</span></p>
                {linkedCustomer ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-green-700">
                      <UserCheck className="h-3.5 w-3.5" />
                      {linkedCustomer.name} {linkedCustomer.vip && "· VIP"} · la venta suma a su historial
                    </p>
                    <button onClick={() => { setLinkedCustomer(null); setCustomerEmail(""); }} className="text-muted hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@cliente.com"
                      value={customerEmail}
                      onChange={e => { setCustomerEmail(e.target.value); setCustomerError(""); }}
                      className="min-w-0 flex-1 rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => linkCustomer.mutate()}
                      disabled={!customerEmail || linkCustomer.isPending}
                      className="shrink-0 rounded-xl border border-line px-3.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      {linkCustomer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Vincular"}
                    </button>
                  </div>
                )}
                {customerError && <p className="mt-1 text-[11px] text-red-500">{customerError}</p>}
              </div>

              {/* Coupon */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink">Cupón <span className="font-normal text-muted">(opcional)</span></p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                      <Tag className="h-3 w-3" /> {appliedCoupon.code} · -{formatPrice(appliedCoupon.discount)}
                    </span>
                    <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-muted hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      placeholder="Código"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                      className="min-w-0 flex-1 rounded-xl border border-line px-3.5 py-2 font-mono text-sm uppercase outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => validateCoupon.mutate(subtotal)}
                      disabled={!couponInput || validateCoupon.isPending}
                      className="shrink-0 rounded-xl border border-line px-3.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      {validateCoupon.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && <p className="mt-1 text-[11px] text-red-500">{couponError}</p>}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-line pt-3 sm:col-span-2">
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-body">Subtotal</span>
                    <span className="text-ink">{formatPrice(subtotal)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-brand">
                    <span>Descuento ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-xl font-semibold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card title="Cobro">
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(["efectivo", "transferencia", "tarjeta"] as const).map(key => {
                const icons = { efectivo: <Banknote className="h-4 w-4" />, transferencia: <Landmark className="h-4 w-4" />, tarjeta: <CreditCard className="h-4 w-4" /> };
                const labels = { efectivo: "Efectivo", transferencia: "Transfer", tarjeta: "Tarjeta" };
                return (
                  <button
                    key={key}
                    onClick={() => setPayMode(key)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-[11px] font-medium transition ${payMode === key ? "border-brand bg-brand-50 text-brand" : "border-line text-ink hover:border-brand"}`}
                  >
                    {icons[key]}{labels[key]}
                  </button>
                );
              })}
            </div>

            {payMode === "efectivo" && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-body">
                  Recibí <span className="font-semibold text-ink">{formatPrice(total)}</span> en efectivo.
                </p>
                <button onClick={handleConfirmSale} disabled={!ticket.length || confirmSaleMutation.isPending}
                  className="btn-brand w-full py-2.5 text-xs disabled:opacity-50">
                  {confirmSaleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  {isOnline ? "Confirmar venta" : "Guardar offline"} · {formatPrice(total)}
                </button>
              </div>
            )}

            {payMode === "transferencia" && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-body">El cliente transfiere <span className="font-semibold text-ink">{formatPrice(total)}</span>:</p>
                {transferInfo && (
                  <div className="rounded-xl bg-stone-50 p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-body">Banco</span><span className="font-medium text-ink">{transferInfo.bank}</span></div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body">Alias</span>
                      <button onClick={() => copy(transferInfo.alias, "alias")} className="flex items-center gap-1.5 font-mono font-semibold text-ink hover:text-brand">
                        {transferInfo.alias}
                        {copied === "alias" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
                      </button>
                    </div>
                    {transferInfo.cbu && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-body">CBU</span>
                        <button onClick={() => copy(transferInfo.cbu, "cbu")} className="flex items-center gap-1.5 font-mono text-xs text-ink hover:text-brand">
                          {transferInfo.cbu}
                          {copied === "cbu" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-body">Titular</span><span className="font-medium text-ink">{transferInfo.holder}</span></div>
                  </div>
                )}
                <button onClick={handleConfirmSale} disabled={!ticket.length || confirmSaleMutation.isPending}
                  className="btn-brand w-full py-2.5 text-xs disabled:opacity-50">
                  {confirmSaleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {isOnline ? "Confirmar transferencia recibida" : "Guardar offline"} · {formatPrice(total)}
                </button>
              </div>
            )}

            {payMode === "tarjeta" && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-body">
                  Cobrá <span className="font-semibold text-ink">{formatPrice(total)}</span> con la posnet física — esto solo registra la venta como pagada con tarjeta.
                </p>
                <button onClick={handleConfirmSale} disabled={!ticket.length || confirmSaleMutation.isPending}
                  className="btn-brand w-full py-2.5 text-xs disabled:opacity-50">
                  {confirmSaleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {isOnline ? "Confirmar venta" : "Guardar offline"} · {formatPrice(total)}
                </button>
              </div>
            )}

            {saleError && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {saleError}
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <button
                onClick={() => cashReg && !skipCaja ? setShowCloseModal(true) : handleEndSession()}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                {cashReg && !skipCaja ? "Cerrar caja" : "Finalizar jornada"}
              </button>
            </div>
          </Card>
        </div>

        {/* Productos — panel angosto: el scanner no necesita esto, queda para búsqueda manual ocasional */}
        <Card title="Productos" padded={false}>
          <div className="p-5 pb-0">
            <div className="mb-4 flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 focus-within:border-brand">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar manual… (el scanner ya funciona solo)"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                autoFocus
              />
              {searchQuery
                ? <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-muted hover:text-ink" /></button>
                : <ScanLine className="h-4 w-4 shrink-0 text-muted" />
              }
            </div>

            {scanFeedback && (
              <div className={`mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${scanFeedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {scanFeedback.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                {scanFeedback.text}
              </div>
            )}
          </div>

          {debouncedQ.length < 2 ? (
            <div className="flex flex-col items-center gap-2 px-5 pb-6 pt-2 text-center">
              <ScanLine className="h-6 w-6 text-muted" />
              <p className="text-xs text-muted">Escaneá en cualquier momento — no hace falta hacer clic acá.<br />También podés buscar por nombre.</p>
            </div>
          ) : searchLoading ? (
            <div className="flex justify-center pb-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : searchError ? (
            <p className="px-5 pb-6 text-center text-xs text-red-600">No se pudo conectar con el servidor.</p>
          ) : searchResults.length === 0 ? (
            <p className="px-5 pb-6 text-center text-xs text-muted">Sin resultados para &ldquo;{debouncedQ}&rdquo;</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto border-t border-line">
              {searchResults.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => p.variants.length > 0 ? setPendingProduct(p) : addToTicket(p)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-stone-bg"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-bg">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-brand">
                        {formatPrice(p.price)}
                        {p.stock <= 5 && <span className="ml-1.5 text-amber-600">· ¡{p.stock} u.!</span>}
                      </p>
                    </div>
                    {p.variants.length > 0 && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Variant picker ─────────────────────────────────────────────── */}
      {pendingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-ink">{pendingProduct.name}</p>
              <button onClick={() => setPendingProduct(null)}><X className="h-4 w-4 text-muted" /></button>
            </div>
            <p className="mb-3 text-xs text-body">Seleccioná el talle / variante:</p>
            <div className="grid grid-cols-3 gap-2">
              {pendingProduct.variants.map(v => (
                <button
                  key={v.id}
                  disabled={v.stock <= 0}
                  onClick={() => addToTicket(pendingProduct, v)}
                  className={`rounded-xl border py-2.5 text-xs font-medium transition ${v.stock <= 0 ? "border-line text-muted opacity-40" : "border-line text-ink hover:border-brand hover:text-brand"}`}
                >
                  <span className="block">{v.label}</span>
                  <span className="block text-[10px] text-muted">{v.stock} u.</span>
                  {v.priceDelta !== 0 && <span className="block text-[10px] text-brand">{v.priceDelta > 0 ? "+" : ""}{formatPrice(v.priceDelta)}</span>}
                </button>
              ))}
            </div>
            <button onClick={() => addToTicket(pendingProduct)} className="mt-3 w-full rounded-xl border border-dashed border-line py-2 text-xs text-muted hover:border-brand hover:text-brand">
              Sin variante específica
            </button>
          </div>
        </div>
      )}

      {/* ── Sale success ───────────────────────────────────────────────── */}
      {saleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-green-50 mx-auto">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="font-display text-xl text-ink">
              {saleSuccess.offlineId ? "Venta guardada offline" : "Venta registrada"}
            </h3>
            {saleSuccess.orderNumber !== "OFFLINE" && (
              <p className="mt-1 text-sm text-muted">Pedido {saleSuccess.orderNumber}</p>
            )}
            {saleSuccess.offlineId && (
              <p className="mt-1 text-xs text-amber-700">Se sincronizará al recuperar conexión.</p>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={handleViewReceipt} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-medium text-ink hover:border-brand hover:text-brand">
                <Eye className="h-4 w-4" /> Ver comprobante
              </button>
              <button onClick={afterSale} className="btn-brand flex-1 py-2.5 text-sm">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cerrar caja modal ──────────────────────────────────────────── */}
      {showCloseModal && !closeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">Cerrar caja</h3>
              <button onClick={() => setShowCloseModal(false)}><X className="h-4 w-4 text-muted" /></button>
            </div>
            <p className="mb-4 text-sm text-body">Contá el efectivo en cajón y registrá el total.</p>
            <label className="mb-1 block text-xs font-medium text-ink">Efectivo físico contado (pesos)</label>
            <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 focus-within:border-brand">
              <span className="text-sm text-muted">$</span>
              <input
                type="number" min="0" step="100"
                value={closeAmount || ""}
                onChange={e => setCloseAmount(Number(e.target.value))}
                className="flex-1 bg-transparent text-right text-sm outline-none"
                autoFocus
              />
            </div>
            <label className="mb-1 block text-xs font-medium text-ink">Observaciones <span className="font-normal text-muted">(opcional)</span></label>
            <textarea
              value={closeNotes}
              onChange={e => setCloseNotes(e.target.value)}
              rows={2}
              placeholder="Diferencias, novedades…"
              className="mb-4 w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 rounded-xl border border-line py-2.5 text-sm text-ink hover:border-brand">
                Cancelar
              </button>
              <button
                onClick={() => closeCaja.mutate()}
                disabled={closeCaja.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {closeCaja.isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Cerrar caja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Close summary ──────────────────────────────────────────────── */}
      {closeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-50">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-display text-lg text-ink">Caja cerrada</h3>
            </div>
            <div className="space-y-2 text-sm">
              {(["efectivo", "transferencia", "tarjeta"] as const).map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-body capitalize">{k}</span>
                  <span className="font-medium text-ink">{formatPrice(closeSummary.summary[k].total)} ({closeSummary.summary[k].count} v.)</span>
                </div>
              ))}
              <div className="border-t border-line pt-2 flex justify-between font-semibold">
                <span>Total ventas</span><span>{formatPrice(closeSummary.summary.total)}</span>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-body">Efectivo esperado</span><span className="font-medium">{formatPrice(closeSummary.expected)}</span></div>
                <div className="flex justify-between"><span className="text-body">Efectivo contado</span><span className="font-medium">{formatPrice(closeSummary.closing_amount)}</span></div>
                <div className={`flex justify-between font-semibold ${closeSummary.diff < 0 ? "text-red-600" : closeSummary.diff > 0 ? "text-amber-700" : "text-green-600"}`}>
                  <span>Diferencia</span>
                  <span>{closeSummary.diff >= 0 ? "+" : ""}{formatPrice(closeSummary.diff)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setCloseSummary(null); setShowCloseModal(false); setCloseAmount(0); setCloseNotes(""); void qc.invalidateQueries({ queryKey: ["pos", "cash-register"] }); }}
              className="mt-5 w-full btn-brand py-2.5 text-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ── Nota de crédito modal ──────────────────────────────────────── */}
      {showCreditNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">Nota de crédito</h3>
              <button onClick={() => { setShowCreditNote(false); setCnOrderNum(""); setCnReason(""); setCnAmount(0); setCnSuccess(""); setCnError(""); }}>
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>

            {cnSuccess ? (
              <div className="text-center py-4">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-green-50 mx-auto">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-semibold text-ink">Nota emitida: {cnSuccess}</p>
                <button
                  onClick={() => { setShowCreditNote(false); setCnOrderNum(""); setCnReason(""); setCnAmount(0); setCnSuccess(""); }}
                  className="mt-4 w-full btn-brand py-2.5 text-sm"
                >
                  Listo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Número de pedido</label>
                  <input
                    value={cnOrderNum}
                    onChange={e => { setCnOrderNum(e.target.value.toUpperCase()); setCnError(""); }}
                    placeholder="PJ-000001"
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Motivo de devolución</label>
                  <textarea
                    value={cnReason}
                    onChange={e => setCnReason(e.target.value)}
                    rows={2}
                    placeholder="Ej: producto defectuoso, talle equivocado…"
                    className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Monto a acreditar (pesos)</label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2.5 focus-within:border-brand">
                    <span className="text-sm text-muted">$</span>
                    <input
                      type="number" min="1" step="100"
                      value={cnAmount || ""}
                      onChange={e => setCnAmount(Number(e.target.value))}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                {cnError && <p className="text-xs text-red-500">{cnError}</p>}
                <button
                  onClick={() => creditNote.mutate()}
                  disabled={!cnOrderNum || !cnReason || !cnAmount || creditNote.isPending}
                  className="w-full btn-brand py-2.5 text-sm disabled:opacity-50"
                >
                  {creditNote.isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Emitir nota de crédito"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Atajos de teclado ──────────────────────────────────────────── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">Atajos de teclado</h3>
              <button onClick={() => setShowShortcuts(false)}><X className="h-4 w-4 text-muted" /></button>
            </div>
            <ul className="divide-y divide-line text-sm">
              {[
                ["Escanear código", "En cualquier parte de la pantalla, sin hacer clic"],
                ["F2", "Foco en el buscador"],
                ["F4", "Confirmar venta"],
                ["F7", "Cambiar forma de pago"],
                ["F8", "Nota de crédito"],
                ["F9", "Historial de cajas"],
                ["Esc", "Cerrar la ventana abierta"],
                ["+ / −", "Sumar/restar cantidad del último producto agregado"],
                ["Supr", "Quitar el último producto agregado"],
              ].map(([key, desc]) => (
                <li key={key} className="flex items-center justify-between py-2.5">
                  <span className="text-body">{desc}</span>
                  <kbd className="rounded-md border border-line bg-stone-bg px-2 py-1 font-mono text-xs text-ink">{key}</kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

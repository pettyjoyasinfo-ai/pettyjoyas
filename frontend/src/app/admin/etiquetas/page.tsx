"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Check, Loader2, Minus, Plus, Printer, RotateCcw, Save, ScanLine, Search, X } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import {
  useAdminProducts, useLabelSettings, useResetLabelSettings, useSaveLabelSettings, useUpdateLabelInfo,
  type LabelSettings,
} from "@/lib/api/admin";
import { adminApiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";

/**
 * Etiqueta de joyería pre-troquelada de dos "orejas" + cola. La forma y la
 * cola ya vienen troqueladas físicamente, así que NO se dibuja ningún
 * contorno: solo se imprime el código (rotado 90°, llenando una oreja) y,
 * en la otra oreja, dos datos que el cliente carga a mano por etiqueta (ej.
 * referencia de proveedor y peso/multiplicador) — ya no el SKU ni el precio,
 * así no hay que reimprimir etiquetas cada vez que cambia un precio. Todo en
 * mm; se calibra a mano y la calibración se guarda para siempre (ver useLabelSettings).
 */
const DEFAULT_FOLD: LabelSettings = {
  pageW: 30, pageH: 70, earW: 15, earH: 25, barcodeSide: "left", codeType: "qr", bcFill: 1,
  offsetX: 0.5, offsetY: -0.5,
};

// Los dos datos manuales de la oreja son texto libre — el cliente carga lo
// que necesite (número, letras, o ambos) en cada campo, sin prefijo fijo.

type LabelItem = {
  key: string;
  productSlug: string;
  variantId: string | null;
  name: string;
  variantLabel: string;
  price: number;
  barcode: string | null;
  imageUrl: string;
  // Última referencia/peso guardados para este producto o variante — se
  // precargan al seleccionar, así no hay que volver a escribirlos.
  savedRef: string;
  savedWeight: string;
};

/** Datos manuales por etiqueta (referencia + peso/multiplicador) — se cargan a mano y se guardan solas. */
type ManualFields = { qty: number; ref: string; weight: string };

function makeBarcodeCanvas(value: string, displayValue: boolean): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  try {
    // CODE128-C empaqueta 2 dígitos por símbolo (código más corto = barras más
    // anchas y legibles). Solo sirve para dígitos en cantidad par; si no, CODE128.
    const evenDigits = /^\d+$/.test(value) && value.length % 2 === 0;
    JsBarcode(canvas, value, {
      format: evenDigits ? "CODE128C" : "CODE128",
      displayValue,
      fontSize: 16,
      textMargin: 2,
      // Zona muda (margen blanco) a los costados: CODE128 pide ~10 módulos de
      // margen antes/después, si no el lector no engancha. width alto = nítido.
      margin: 40,
      height: 150,
      width: 4,
    });
  } catch {
    return null;
  }
  return canvas;
}

/** QR cuadrado y nítido (módulos dibujados a mano, con zona muda estándar). Ideal para orejas chicas. */
function qrDataUrl(value: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const count = qr.modules.size;
    const data = qr.modules.data;
    const quiet = 4; // zona muda estándar del QR (4 módulos)
    const total = count + quiet * 2;
    const cell = 8; // px por módulo → alta resolución, sin blur
    const dim = total * cell;
    const canvas = document.createElement("canvas");
    canvas.width = dim;
    canvas.height = dim;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = "#000";
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (data[r * count + c]) {
          ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
        }
      }
    }
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Rota un canvas 90° y devuelve su data URL + ratio (ancho/alto). */
function rotateCanvas90(src: HTMLCanvasElement): { url: string; ratio: number } | null {
  const out = document.createElement("canvas");
  out.width = src.height;
  out.height = src.width;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false; // barras nítidas, sin blur al rotar
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return { url: out.toDataURL("image/png"), ratio: out.width / out.height };
}

/**
 * Código de barras rotado 90° (sin número), con sus proporciones. Devuelve el
 * ratio (ancho/alto) para poder ubicarlo sin deformar las barras (más finas).
 */
function rotatedBarcode(value: string): { url: string; ratio: number } | null {
  const src = makeBarcodeCanvas(value, false);
  return src ? rotateCanvas90(src) : null;
}

/**
 * Dos líneas de texto (mismo peso visual) dibujadas en un canvas y rotadas
 * 90°, para pegarlas como imagen perfectamente centrada en la oreja (evita
 * los problemas de centrado del texto rotado nativo de jsPDF). Se usa para
 * los dos datos manuales por etiqueta (ej. referencia + peso/multiplicador).
 */
function rotatedLabelText(line1: string, line2: string): { url: string; ratio: number } | null {
  if (typeof document === "undefined") return null;
  const W = 260, H = 140;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 40px Helvetica, Arial, sans-serif";
  if (line1 && line2) {
    ctx.fillText(line1, W / 2, H * 0.32);
    ctx.fillText(line2, W / 2, H * 0.68);
  } else {
    ctx.fillText(line1 || line2, W / 2, H / 2);
  }
  return rotateCanvas90(canvas);
}

/** Ubica una imagen (url+ratio) centrada dentro de una caja, sin deformar, ocupando la fracción `fill`. */
function placeCentered(
  doc: jsPDF,
  img: { url: string; ratio: number },
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  fill: number,
) {
  const availW = boxW * fill;
  const availH = boxH * fill;
  let w = availW;
  let h = w / img.ratio;
  if (h > availH) { h = availH; w = h * img.ratio; }
  doc.addImage(img.url, "PNG", boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h);
}

/**
 * Tag de dos orejas: en una oreja el código (QR o barras) rotado 90° (lleno),
 * en la otra los dos datos manuales de esa etiqueta (referencia + peso/multiplicador).
 * La cola (debajo de las orejas) queda en blanco.
 */
function drawFoldContent(doc: jsPDF, item: LabelItem, c: LabelSettings, manual: { ref: string; weight: string }) {
  const barcodeEarX = c.barcodeSide === "left" ? 0 : c.earW;
  const textEarX = c.barcodeSide === "left" ? c.earW : 0;
  const m = 0.8; // margen interno de cada oreja (chico: casi todo el espacio es para el contenido)
  const ox = c.offsetX;
  const oy = c.offsetY;

  // Oreja del código.
  if (item.barcode && c.codeType === "qr") {
    // QR cuadrado, centrado — ideal para orejas chicas (se lee holgado).
    const qr = qrDataUrl(item.barcode);
    if (qr) placeCentered(doc, { url: qr, ratio: 1 }, barcodeEarX + m + ox, m + oy, c.earW - 2 * m, c.earH - 2 * m, c.bcFill);
  } else if (item.barcode) {
    // Código de barras 1D rotado que llena la oreja.
    const bc = rotatedBarcode(item.barcode);
    if (bc) {
      const w = (c.earW - 2 * m) * c.bcFill;
      const h = (c.earH - 2 * m) * c.bcFill;
      doc.addImage(bc.url, "PNG", barcodeEarX + (c.earW - w) / 2 + ox, (c.earH - h) / 2 + oy, w, h);
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("Sin código", barcodeEarX + c.earW / 2, c.earH / 2, { align: "center" });
  }

  // Oreja del texto: los dos datos manuales de esta etiqueta, dibujados en un
  // canvas y rotados 90°, pegados centrados como imagen (centrado exacto).
  const txt = rotatedLabelText(manual.ref.trim(), manual.weight.trim());
  if (txt) {
    placeCentered(doc, txt, textEarX + m + ox, m + oy, c.earW - 2 * m, c.earH - 2 * m, 0.92);
  }
}

const cm = (mm: number) => (mm / 10).toFixed(2).replace(".", ",");

export default function AdminEtiquetas() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: savedSettings, isLoading: settingsLoading } = useLabelSettings();
  const saveSettings = useSaveLabelSettings();
  const resetSettings = useResetLabelSettings();
  const updateLabelInfo = useUpdateLabelInfo();
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, ManualFields>>({});
  const [generating, setGenerating] = useState(false);
  const [fold, setFold] = useState<LabelSettings>(DEFAULT_FOLD);
  const [dirty, setDirty] = useState(false);

  // Hidrata el formulario con la calibración guardada apenas llega.
  useEffect(() => {
    if (savedSettings) setFold(savedSettings);
  }, [savedSettings]);

  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<{ ok: boolean; name?: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  function updateFold(patch: Partial<LabelSettings>) {
    setFold(prev => ({ ...prev, ...patch }));
    setDirty(true);
  }

  function setFoldNum(k: "pageW" | "pageH" | "earW" | "earH" | "offsetX" | "offsetY", v: number) {
    updateFold({ [k]: Number.isFinite(v) ? v : 0 });
  }

  function handleReset() {
    resetSettings.mutate(undefined, {
      onSuccess: (data) => { setFold(data); setDirty(false); },
    });
  }

  function handleSave() {
    saveSettings.mutate(fold, { onSuccess: () => setDirty(false) });
  }

  // Cada producto sin variantes es una etiqueta; cada variante de un producto
  // con variantes (talle, color…) es su propia etiqueta con su propio código.
  const items: LabelItem[] = useMemo(() => {
    const out: LabelItem[] = [];
    for (const p of products) {
      const img = p.images?.[0] ?? "";
      if (p.variants?.length) {
        for (const v of p.variants) {
          out.push({
            key: `${p.id}:${v.id}`,
            productSlug: p.slug,
            variantId: v.id,
            name: p.name,
            variantLabel: v.label ?? "",
            price: p.price + (v.priceDelta ?? 0),
            barcode: v.barcode ?? null,
            imageUrl: v.imageUrl || img,
            savedRef: v.labelRef ?? "",
            savedWeight: v.labelWeight ?? "",
          });
        }
      } else {
        out.push({
          key: `${p.id}:`,
          productSlug: p.slug,
          variantId: null,
          name: p.name,
          variantLabel: "",
          price: p.price,
          barcode: p.barcode ?? null,
          imageUrl: img,
          savedRef: p.labelRef ?? "",
          savedWeight: p.labelWeight ?? "",
        });
      }
    }
    return out;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      i => i.name.toLowerCase().includes(q) || i.variantLabel.toLowerCase().includes(q) || i.barcode?.includes(q),
    );
  }, [items, search]);

  const queue = items.filter(i => (selected[i.key]?.qty ?? 0) > 0);
  const totalLabels = queue.reduce((s, i) => s + selected[i.key].qty, 0);

  function toggle(item: LabelItem) {
    setSelected(prev => {
      if (prev[item.key]) {
        const next = { ...prev };
        delete next[item.key];
        return next;
      }
      // Precarga lo último guardado para este producto/variante, así no hay que reescribirlo.
      return { ...prev, [item.key]: { qty: 1, ref: item.savedRef, weight: item.savedWeight } };
    });
  }

  /**
   * Carga el texto de referencia/peso y lo guarda solo, sin botón: espera a
   * que el usuario deje de escribir (600ms) y lo persiste en el producto o
   * variante — la próxima vez que se seleccione, ya viene precargado.
   */
  function setManual(item: LabelItem, patch: Partial<Pick<ManualFields, "ref" | "weight">>) {
    setSelected(prev => {
      if (!prev[item.key]) return prev;
      const next = { ...prev[item.key], ...patch };

      clearTimeout(saveTimers.current[item.key]);
      saveTimers.current[item.key] = setTimeout(() => {
        updateLabelInfo.mutate({
          productSlug: item.productSlug,
          variantId: item.variantId,
          ref: next.ref,
          weight: next.weight,
        });
      }, 600);

      return { ...prev, [item.key]: next };
    });
  }

  function setQty(key: string, qty: number) {
    setSelected(prev => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...(prev[key] ?? { ref: "", weight: "" }), qty } };
    });
  }

  async function generatePdf() {
    if (queue.length === 0) return;
    setGenerating(true);
    try {
      const orientation: "landscape" | "portrait" = fold.pageW >= fold.pageH ? "landscape" : "portrait";
      const doc = new jsPDF({ orientation, unit: "mm", format: [fold.pageW, fold.pageH] });
      let first = true;
      for (const item of queue) {
        const info = selected[item.key];
        for (let i = 0; i < info.qty; i++) {
          if (!first) doc.addPage([fold.pageW, fold.pageH], orientation);
          first = false;
          drawFoldContent(doc, item, fold, { ref: info.ref.trim(), weight: info.weight.trim() });
        }
      }
      doc.save("etiquetas-joyeria.pdf");
    } finally {
      setGenerating(false);
    }
  }

  async function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !scanInput.trim()) return;
    setScanLoading(true);
    setScanResult(null);
    try {
      const p = await adminApiFetch<{ name: string }>(`/products/lookup?barcode=${encodeURIComponent(scanInput.trim())}`);
      setScanResult({ ok: true, name: p.name });
    } catch {
      setScanResult({ ok: false });
    } finally {
      setScanLoading(false);
      setScanInput("");
    }
  }

  return (
    <>
      <PageHeader
        title="Etiquetas y código de barras"
        description="Seleccioná los productos y generá un PDF con sus códigos, listo para imprimir en tus etiquetas de joyería."
        action={
          <button
            onClick={generatePdf}
            disabled={totalLabels === 0 || generating}
            className="btn-brand px-4 py-2 text-xs disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            Generar PDF {totalLabels > 0 && `(${totalLabels})`}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          {/* Buscador + listado de productos */}
          <Card title="Productos" padded={false}>
            <div className="border-b border-line p-4">
              <div className="flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 focus-within:border-brand">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, talle o código…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Sin productos para mostrar.</p>
            ) : (
              <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
                {filtered.map(item => {
                  const info = selected[item.key];
                  const isSelected = !!info;
                  return (
                    <li key={item.key} className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggle(item)}
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
                            isSelected ? "border-brand bg-brand-50 text-brand" : "border-line text-transparent hover:border-brand"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-bg">
                          {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                          <p className="truncate text-xs text-muted">
                            {item.variantLabel && `${item.variantLabel} · `}
                            {item.barcode ?? "sin código"} · {formatPrice(item.price)}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => setQty(item.key, info.qty - 1)}
                              className="grid h-6 w-6 place-items-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-sm">{info.qty}</span>
                            <button
                              onClick={() => setQty(item.key, info.qty + 1)}
                              className="grid h-6 w-6 place-items-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-2 grid grid-cols-2 gap-2 pl-12">
                          <div className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 focus-within:border-brand">
                            <input
                              value={info.ref}
                              onChange={e => setManual(item, { ref: e.target.value })}
                              placeholder="Referencia (ej. CO 0015)"
                              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 focus-within:border-brand">
                            <input
                              value={info.weight}
                              onChange={e => setManual(item, { weight: e.target.value })}
                              placeholder="Peso / multiplicador (ej. 5,1)"
                              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Calibración del tag de joyería */}
          <Card
            title="Ajustes del formato de joyería (mm)"
            action={
              <div className="flex items-center gap-2">
                {dirty && <span className="text-[11px] text-amber-600">Sin guardar</span>}
                <button
                  onClick={handleReset}
                  disabled={resetSettings.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {resetSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Restablecer
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveSettings.isPending || settingsLoading}
                  className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {saveSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Guardar calibración
                </button>
              </div>
            }
          >
            <p className="mb-4 text-xs text-body">
              Medí tu etiqueta real con una regla y ajustá estos valores hasta que el código caiga en el lugar
              correcto. Imprimí una de prueba, corregí y repetí. Al guardar, esta calibración queda para siempre
              (aunque cierres el navegador o entres desde otra compu).
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <FoldInput label="Ancho total" value={fold.pageW} onChange={v => setFoldNum("pageW", v)} />
              <FoldInput label="Alto total" value={fold.pageH} onChange={v => setFoldNum("pageH", v)} />
              <div />
              <FoldInput label="Oreja · ancho" value={fold.earW} onChange={v => setFoldNum("earW", v)} />
              <FoldInput label="Oreja · alto" value={fold.earH} onChange={v => setFoldNum("earH", v)} />
              <div />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-ink">Tipo de código</span>
                <select
                  value={fold.codeType}
                  onChange={e => updateFold({ codeType: e.target.value as "qr" | "barcode" })}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                >
                  <option value="qr">QR (recomendado)</option>
                  <option value="barcode">Barras (1D)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-ink">Código en</span>
                <select
                  value={fold.barcodeSide}
                  onChange={e => updateFold({ barcodeSide: e.target.value as "left" | "right" })}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                >
                  <option value="left">Oreja izquierda</option>
                  <option value="right">Oreja derecha</option>
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-1 sm:col-span-3">
                <span className="text-[11px] font-medium text-ink">
                  Tamaño del código: {Math.round(fold.bcFill * 100)}%
                </span>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.05"
                  value={fold.bcFill}
                  onChange={e => updateFold({ bcFill: parseFloat(e.target.value) })}
                  className="accent-brand"
                />
              </label>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-3 text-xs text-body">
                Ajuste fino: si el código/texto no queda centrado en la etiqueta impresa, corré todo el
                contenido (ambas orejas juntas) hasta que calce. Positivo = derecha / abajo.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FoldInput label="Ajuste horizontal" value={fold.offsetX} onChange={v => setFoldNum("offsetX", v)} step={0.5} allowNegative />
                <FoldInput label="Ajuste vertical" value={fold.offsetY} onChange={v => setFoldNum("offsetY", v)} step={0.5} allowNegative />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-xs text-brand-700">
              <p className="font-semibold text-brand">Formulario para Windows (Propiedades del servidor de impresión)</p>
              <p className="mt-1 text-brand-700">
                Sistema <strong>Métrico</strong> · Ancho <strong>{cm(fold.pageW)} cm</strong> · Alto{" "}
                <strong>{cm(fold.pageH)} cm</strong> · todos los márgenes en <strong>0,00</strong>.
              </p>
            </div>
          </Card>
        </div>

        {/* Scanner + vista previa */}
        <div className="flex h-fit flex-col gap-5">
          {/* Vista previa de la primera etiqueta seleccionada */}
          {queue[0] && (() => {
            const scale = 6; // px por mm en pantalla
            const m = 0.8; // igual que el margen interno del PDF
            const barcodeLeft = fold.barcodeSide === "left" ? 0 : fold.earW;
            const textLeft = fold.barcodeSide === "left" ? fold.earW : 0;
            const tailW = 4;
            const nudge = { transform: `translate(${fold.offsetX * scale}px, ${fold.offsetY * scale}px)` };
            const info = selected[queue[0].key];
            return (
              <Card title="Vista previa · joyería (2 orejas)">
                <div className="flex justify-center">
                  <div className="relative" style={{ width: fold.pageW * scale, height: fold.pageH * scale }}>
                    {/* oreja del código: QR (2D) o barras (1D rotado) */}
                    <div
                      className="absolute flex items-center justify-center overflow-hidden rounded-sm bg-white ring-1 ring-line"
                      style={{ left: barcodeLeft * scale, top: 0, width: fold.earW * scale, height: fold.earH * scale }}
                    >
                     <div className="flex items-center justify-center" style={nudge}>
                      {fold.codeType === "qr" ? (() => {
                        const side = Math.min(fold.earW - 2 * m, fold.earH - 2 * m) * fold.bcFill * scale;
                        const qr = queue[0].barcode ? qrDataUrl(queue[0].barcode) : null;
                        return qr
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={qr} alt="QR" width={side} height={side} style={{ imageRendering: "pixelated" }} />
                          : <span className="text-[8px] text-muted">sin código</span>;
                      })() : (
                        <div
                          className="bg-[repeating-linear-gradient(0deg,#1a1a1a_0,#1a1a1a_0.8px,#fff_0.8px,#fff_2px)]"
                          style={{ width: (fold.earW - 2 * m) * fold.bcFill * scale, height: (fold.earH - 2 * m) * fold.bcFill * scale }}
                        />
                      )}
                     </div>
                    </div>
                    {/* oreja del texto: los dos datos manuales de esta etiqueta, rotados 90°
                        (acompañan al código), en dos columnas centradas — igual que el PDF */}
                    <div
                      className="absolute overflow-hidden rounded-sm bg-white ring-1 ring-line"
                      style={{ left: textLeft * scale, top: 0, width: fold.earW * scale, height: fold.earH * scale }}
                    >
                     <div className="absolute inset-0" style={nudge}>
                      {(() => {
                        const two = !!info.ref && !!info.weight;
                        const line1Left = two ? fold.earW * 0.32 : fold.earW / 2;
                        const line2Left = two ? fold.earW * 0.68 : fold.earW / 2;
                        return (
                          <>
                            {info.ref && (
                              <span
                                className="absolute whitespace-nowrap text-[11px] font-bold text-ink"
                                style={{ left: line1Left * scale, top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}
                              >
                                {info.ref}
                              </span>
                            )}
                            {info.weight && (
                              <span
                                className="absolute whitespace-nowrap text-[11px] font-bold text-ink"
                                style={{ left: line2Left * scale, top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}
                              >
                                {info.weight}
                              </span>
                            )}
                            {!info.ref && !info.weight && (
                              <span
                                className="absolute whitespace-nowrap text-[9px] text-muted"
                                style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}
                              >
                                Cargá referencia/peso →
                              </span>
                            )}
                          </>
                        );
                      })()}
                     </div>
                    </div>
                    {/* cola en blanco */}
                    <div
                      className="absolute rounded-b-sm bg-white ring-1 ring-line"
                      style={{ left: (fold.pageW / 2 - tailW / 2) * scale, top: fold.earH * scale, width: tailW * scale, height: (fold.pageH - fold.earH) * scale }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] text-muted">
                  Dos orejas de {fold.earW}×{fold.earH} mm + cola · área total {fold.pageW}×{fold.pageH} mm. La forma
                  troquelada es física; acá solo se posiciona el contenido.
                </p>
              </Card>
            );
          })()}

          <Card title="Probar lectura con la pistola">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-stone-bg p-5 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand shadow-sm">
                <ScanLine className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-ink">Hacé clic acá y escaneá una etiqueta</p>
              <p className="text-xs text-body">
                La mayoría de las pistolas USB funcionan como teclado (HID): no necesitan instalar nada, solo
                conectarlas y escanear con el cursor en este campo.
              </p>
              <input
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="… o ingresalo manualmente"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-center font-mono text-sm outline-none focus:border-brand"
                autoFocus
              />
              {scanLoading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              {scanResult && !scanLoading && (
                scanResult.ok
                  ? <p className="flex items-center gap-1.5 text-xs text-green-700"><Check className="h-3.5 w-3.5" /> {scanResult.name}</p>
                  : <p className="flex items-center gap-1.5 text-xs text-red-600"><X className="h-3.5 w-3.5" /> Código no encontrado</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/** Input numérico chico para la calibración del tag de joyería. */
function FoldInput({
  label, value, onChange, step = 0.5, allowNegative = false,
}: { label: string; value: number; onChange: (v: number) => void; step?: number; allowNegative?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-ink">{label}</span>
      <input
        type="number"
        min={allowNegative ? undefined : "0"}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

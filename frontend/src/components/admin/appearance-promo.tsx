"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Card, FieldLabel, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { PromoCard, isPromoActive } from "@/components/shop/promo-strip";
import { useAdminCategories, useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, type PromoItem, type PromoSettings } from "@/lib/data/settings";

const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";
// 0 = domingo (como Date.getDay), mostrados de lunes a domingo.
const DAYS: { n: number; label: string }[] = [
  { n: 1, label: "Lun" }, { n: 2, label: "Mar" }, { n: 3, label: "Mié" }, { n: 4, label: "Jue" },
  { n: 5, label: "Vie" }, { n: 6, label: "Sáb" }, { n: 0, label: "Dom" },
];

function newItem(): PromoItem {
  return {
    id: `promo-${Date.now()}`, enabled: true, title: "", text: "",
    bg: "#821f40", fg: "#ffffff", image: null, href: null, cta: null, days: [], from: null, to: null,
  };
}

/** Explica en palabras cuándo se muestra un flyer. */
function whenText(it: PromoItem): string {
  const days = it.days?.length
    ? DAYS.filter((d) => it.days!.includes(d.n)).map((d) => d.label).join(", ")
    : "todos los días";
  const range = it.from || it.to ? ` · ${it.from ? `desde ${it.from}` : ""}${it.from && it.to ? " " : ""}${it.to ? `hasta ${it.to}` : ""}` : "";
  return `${days}${range}`;
}

export function AppearancePromo() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia("hero");
  const { data: categories = [] } = useAdminCategories();
  // Destinos listos para el botón: así no hay que escribir el link a mano.
  const destinations: { label: string; href: string }[] = [
    { label: "Toda la tienda", href: "/tienda" },
    { label: "Productos en oferta", href: "/tienda?oferta=1" },
    ...categories
      .filter((c: any) => c.slug)
      .map((c: any) => ({
        label: c.parentSlug
          ? `${categories.find((p: any) => p.slug === c.parentSlug)?.name ?? c.parentSlug} › ${c.name}`
          : c.name,
        href: `/tienda?categoria=${c.slug}`,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, "es")),
  ];

  const [promo, setPromo] = useState<PromoSettings>(DEFAULT_SETTINGS.promo);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (data) setPromo(data.promo ?? DEFAULT_SETTINGS.promo);
  }, [data]);

  function setItem(i: number, patch: Partial<PromoItem>) {
    setPromo((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  }
  function toggleDay(i: number, n: number) {
    const days = promo.items[i].days ?? [];
    setItem(i, { days: days.includes(n) ? days.filter((d) => d !== n) : [...days, n] });
  }

  async function onUpload(i: number, file: File) {
    setUploading(i);
    try {
      const { url } = await upload.mutateAsync(file);
      setItem(i, { image: url });
    } catch {
      setError("No se pudo subir la imagen (máx. 5 MB).");
    } finally {
      setUploading(null);
    }
  }

  async function onSave() {
    setSaved(false);
    setError("");
    const items = promo.items
      .filter((i) => i.title.trim())
      .map((i) => ({
        ...i,
        title: i.title.trim(),
        text: i.text?.trim() || null,
        href: i.href?.trim() && i.href.trim() !== "https://" ? i.href.trim() : null,
        cta: i.cta?.trim() || null,
        from: i.from || null,
        to: i.to || null,
      }));
    try {
      await save.mutateAsync({ promo: { ...promo, items } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar. Revisá los campos.");
    }
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card
      title="Flyers promocionales (barra flotante abajo)"
      action={
        <span className="flex items-center gap-2 text-xs text-body">
          Visible <button onClick={() => setPromo((p) => ({ ...p, enabled: !p.enabled }))}><Toggle on={promo.enabled} /></button>
        </span>
      }
    >
      <p className="mb-4 text-xs text-muted">
        Una barra chica fija en la parte de abajo de la tienda, que acompaña al cliente mientras navega y aparece de a poco.
        Se puede cerrar y no se muestra en el carrito ni en el checkout. Si hay varias vigentes el mismo día, van rotando.
        Ej.: &quot;15% de descuento en efectivo o transferencia (excepto Oro)&quot; o &quot;Ahora Misiones con Banco Macro&quot; de lunes a miércoles.
      </p>

      <div className="flex flex-col gap-4">
        {promo.items.map((it, i) => (
          <div key={it.id || i} className="rounded-2xl border border-line p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs text-body">
                <button onClick={() => setItem(i, { enabled: !it.enabled })}><Toggle on={it.enabled} /></button>
                {it.enabled ? "Activo" : "Pausado"}
                <span className="text-muted">· {whenText(it)}</span>
                {isPromoActive(it) && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Se ve hoy</span>}
              </span>
              <button
                onClick={() => setPromo((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600"
                aria-label="Eliminar flyer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <FieldLabel label="Título" required />
                <input value={it.title} maxLength={90} onChange={(e) => setItem(i, { title: e.target.value })}
                  placeholder="15% OFF en efectivo o transferencia" className={inp} />
              </label>
              <label className="flex flex-col gap-1.5">
                <FieldLabel label="Bajada" optional />
                <input value={it.text ?? ""} maxLength={160} onChange={(e) => setItem(i, { text: e.target.value })}
                  placeholder="Excepto productos de Oro" className={inp} />
              </label>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <FieldLabel label="Botón: a dónde lleva" optional />
                <div className="flex flex-wrap gap-2">
                  <select
                    value={destinations.some((d) => d.href === it.href) ? it.href ?? "" : it.href ? "__otro" : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__otro") setItem(i, { href: it.href && !destinations.some((d) => d.href === it.href) ? it.href : "https://" });
                      else setItem(i, { href: v || null });
                    }}
                    className={`${inp} min-w-0 flex-1`}
                  >
                    <option value="">Sin botón</option>
                    {destinations.map((d) => (
                      <option key={d.href} value={d.href}>{d.label}</option>
                    ))}
                    <option value="__otro">Otro link…</option>
                  </select>
                  {it.href && (
                    <input value={it.cta ?? ""} maxLength={30} onChange={(e) => setItem(i, { cta: e.target.value })}
                      placeholder="Texto del botón (ej. Ver relojes)" className={`${inp} min-w-0 flex-1`} />
                  )}
                </div>
                {it.href && !destinations.some((d) => d.href === it.href) && (
                  <input value={it.href} maxLength={300} onChange={(e) => setItem(i, { href: e.target.value })}
                    placeholder="/tienda?q=casio o https://…" className={inp} />
                )}
                <span className="text-[11px] text-muted">
                  {it.href ? `El botón dice "${it.cta?.trim() || "Ver más"}". Tocar el flyer también lleva ahí.` : "Sin destino no se muestra ningún botón."}
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5">
                  <FieldLabel label="Fondo" />
                  <input type="color" value={it.bg || "#821f40"} onChange={(e) => setItem(i, { bg: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FieldLabel label="Texto" />
                  <input type="color" value={it.fg || "#ffffff"} onChange={(e) => setItem(i, { fg: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
                </label>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel label="Imagen" optional />
                  <span className="flex items-center gap-2">
                    <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 text-xs text-body hover:border-brand">
                      {uploading === i ? <Spinner className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
                      {it.image ? "Cambiar" : "Subir"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && onUpload(i, e.target.files[0])} />
                    </label>
                    {it.image && (
                      <button onClick={() => setItem(i, { image: null })} className="text-xs text-muted hover:text-red-600">Quitar</button>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              <FieldLabel label="Días en que se muestra" optional />
              <div className="flex flex-wrap items-center gap-1.5">
                {DAYS.map((d) => {
                  const on = it.days?.includes(d.n);
                  return (
                    <button key={d.n} type="button" onClick={() => toggleDay(i, d.n)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-brand bg-brand text-white" : "border-line text-body hover:border-brand"}`}>
                      {d.label}
                    </button>
                  );
                })}
                <span className="ml-1 text-[11px] text-muted">Sin marcar = todos los días.</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex flex-col gap-1.5">
                <FieldLabel label="Desde" optional />
                <input type="date" value={it.from ?? ""} onChange={(e) => setItem(i, { from: e.target.value || null })} className={inp} />
              </label>
              <label className="flex flex-col gap-1.5">
                <FieldLabel label="Hasta" optional />
                <input type="date" value={it.to ?? ""} onChange={(e) => setItem(i, { to: e.target.value || null })} className={inp} />
              </label>
            </div>

            {it.title.trim() && (
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Vista previa</p>
                <PromoCard item={it} />
              </div>
            )}
          </div>
        ))}

        {promo.items.length < 6 && (
          <button onClick={() => setPromo((p) => ({ ...p, items: [...p.items, newItem()] }))}
            className="flex items-center gap-1.5 self-start rounded-full border border-dashed border-line px-4 py-2 text-xs text-muted transition hover:border-brand hover:text-brand">
            <Plus className="h-3.5 w-3.5" /> Agregar flyer
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button onClick={onSave} disabled={save.isPending} className="btn-brand px-5 py-2.5 text-xs">
          {save.isPending ? <Spinner /> : "Guardar flyers"}
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-700"><Check className="h-4 w-4" /> Guardado</span>}
      </div>
    </Card>
  );
}

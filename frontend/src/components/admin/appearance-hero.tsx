"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, ImagePlus, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { Card, FieldLabel, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useLinkDestinations } from "@/components/admin/link-destinations";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, HERO_ASPECTS, type HeroAspect, type HeroSlide } from "@/lib/data/settings";

const inp =
  "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

function SlideRow({
  slide,
  index,
  total,
  ratio,
  uploading,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpload,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  ratio: string;
  uploading: boolean;
  onUpdate: (patch: Partial<HeroSlide>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const destinations = useLinkDestinations();
  const href = slide.href ?? "";
  const isPreset = destinations.some((d) => d.href === href);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row">
      {/* Miniatura con el mismo formato que en la tienda */}
      <div className="w-full shrink-0 sm:w-48">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Cambiar imagen"
          className="group relative block w-full overflow-hidden rounded-xl bg-stone-bg"
          style={{ aspectRatio: ratio }}
        >
          {slide.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs text-muted">
              <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" /> Subir imagen</span>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 flex justify-center pb-1.5">
            {uploading ? (
              <Spinner className="text-white" />
            ) : (
              slide.image && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow">Cambiar</span>
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        <p className="mt-1 text-center text-[11px] text-muted">Imagen {index + 1}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <FieldLabel label="Al tocarla lleva a" optional />
          <select
            value={isPreset ? href : href ? "__otro" : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__otro") onUpdate({ href: !isPreset && href ? href : "https://" });
              else onUpdate({ href: v || undefined });
            }}
            className={inp}
          >
            <option value="">No lleva a ningún lado</option>
            {destinations.map((d) => (
              <option key={d.href} value={d.href}>{d.label}</option>
            ))}
            <option value="__otro">Otro link…</option>
          </select>
        </label>
        {href && !isPreset && (
          <input value={href} onChange={(e) => onUpdate({ href: e.target.value })} placeholder="/tienda?q=casio o https://…" className={inp} />
        )}
        <label className="flex flex-col gap-1">
          <FieldLabel label="Descripción de la imagen" optional />
          <input
            value={slide.title ?? ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Ej: Anillos de oro 18k (ayuda a Google y a lectores de pantalla)"
            className={inp}
          />
        </label>

        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-body">
            Visible
            <button type="button" onClick={() => onUpdate({ enabled: !(slide.enabled ?? true) })} tabIndex={-1}>
              <Toggle on={slide.enabled ?? true} />
            </button>
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onMoveUp} disabled={index === 0} aria-label="Subir"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={index === total - 1} aria-label="Bajar"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={onRemove} aria-label="Eliminar imagen"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vista previa: cómo se ven las primeras imágenes visibles en PC (2) y en el celular (1). */
function Preview({ slides, ratio }: { slides: HeroSlide[]; ratio: string }) {
  const visible = slides.filter((s) => s.enabled !== false && s.image);
  if (visible.length === 0) return null;
  const desktop = visible.slice(0, visible.length >= 2 ? 2 : 1);
  const cell = (s: HeroSlide, i: number) => (
    <div key={i} className="relative w-full overflow-hidden bg-stone-bg" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
  return (
    <div className="mb-5 grid grid-cols-1 gap-4 rounded-2xl bg-stone-bg p-4 md:grid-cols-[1fr_160px]">
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted"><Monitor className="h-3.5 w-3.5" /> En PC</p>
        <div className={`grid overflow-hidden rounded-lg ${desktop.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>{desktop.map(cell)}</div>
      </div>
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted"><Smartphone className="h-3.5 w-3.5" /> En celular</p>
        <div className="overflow-hidden rounded-lg">{cell(visible[0], 0)}</div>
      </div>
    </div>
  );
}

export function AppearanceHero() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia("hero");

  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SETTINGS.hero.slides);
  const [aspect, setAspect] = useState<HeroAspect>("4/3");
  const [saved, setSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Cambios todavía no guardados (las imágenes se guardan solas al subirlas).
  const [dirty, setDirty] = useState(false);
  // Última versión: la subida tarda y mientras tanto pueden editar otras cosas.
  const slidesRef = useRef(slides);
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  const aspectRef = useRef(aspect);
  useEffect(() => { aspectRef.current = aspect; }, [aspect]);

  useEffect(() => {
    if (data?.hero?.slides) setSlides(data.hero.slides);
    if (data?.hero?.aspect && data.hero.aspect in HERO_ASPECTS) setAspect(data.hero.aspect as HeroAspect);
  }, [data]);

  const ratio = HERO_ASPECTS[aspect].css;

  function change(next: HeroSlide[]) {
    setSlides(next);
    setDirty(true);
  }
  function update(i: number, patch: Partial<HeroSlide>) {
    change(slides.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }
  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= slides.length) return;
    const a = [...slides];
    [a[i], a[j]] = [a[j], a[i]];
    change(a);
  }

  /** Guarda en el servidor. Devuelve false (y muestra el error) si no se pudo. */
  async function persist(next: HeroSlide[], nextAspect: HeroAspect): Promise<boolean> {
    setError("");
    try {
      await save.mutateAsync({
        hero: { aspect: nextAspect, slides: next.filter((s) => s.image?.trim()) },
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return true;
    } catch (e: any) {
      setError(e?.message ? `No se pudo guardar: ${e.message}` : "No se pudo guardar. Probá de nuevo.");
      return false;
    }
  }

  async function handleUpload(i: number, file: File) {
    setUploadingIdx(i);
    setError("");
    try {
      const { url } = await upload.mutateAsync(file);
      // Se guarda enseguida: no hace falta acordarse de "Guardar".
      const next = slidesRef.current.map((sl, idx) => (idx === i ? { ...sl, image: url } : sl));
      setSlides(next);
      await persist(next, aspectRef.current);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setUploadingIdx(null);
    }
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card
      title="Imágenes del inicio (carrusel principal)"
      action={
        <button
          type="button"
          onClick={() => change([...slides, { id: `hero-${Date.now()}`, title: "", image: "", href: "/tienda", enabled: true }])}
          className="flex items-center gap-1.5 text-xs font-medium text-brand"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar imagen
        </button>
      }
    >
      <p className="mb-3 text-xs text-muted">
        Imágenes completas, sin texto encima (si querés texto, ponelo en la imagen). En PC se ven{" "}
        <strong className="text-ink">2 lado a lado</strong> y en el celular <strong className="text-ink">1 por vez</strong>.
        Al subir una imagen se guarda sola; el orden, los links y el formato se guardan con <strong className="text-ink">Guardar</strong>.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <FieldLabel label="Formato de las imágenes" />
          <select
            value={aspect}
            onChange={(e) => { setAspect(e.target.value as HeroAspect); setDirty(true); }}
            className={`${inp} w-60`}
          >
            {(Object.keys(HERO_ASPECTS) as HeroAspect[]).map((k) => (
              <option key={k} value={k}>{HERO_ASPECTS[k].label}</option>
            ))}
          </select>
        </label>
        <p className="pb-2.5 text-xs text-muted">
          Tamaño recomendado: <strong className="text-ink">{HERO_ASPECTS[aspect].size}</strong>. Si la imagen tiene otra forma, se recorta un poco por los bordes.
        </p>
      </div>

      <Preview slides={slides} ratio={ratio} />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex flex-col gap-3">
        {slides.map((slide, i) => (
          <SlideRow
            key={slide.id ?? i}
            slide={slide}
            index={i}
            total={slides.length}
            ratio={ratio}
            uploading={uploadingIdx === i}
            onUpdate={(patch) => update(i, patch)}
            onRemove={() => change(slides.filter((_, idx) => idx !== i))}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            onUpload={(file) => handleUpload(i, file)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => persist(slides, aspect)} disabled={save.isPending} className="btn-brand px-5 py-2.5 text-xs">
          {save.isPending ? <Spinner /> : "Guardar"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {!saved && dirty && <span className="text-xs text-amber-700">Tenés cambios sin guardar</span>}
      </div>
    </Card>
  );
}

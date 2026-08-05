"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Scissors, Trash2 } from "lucide-react";
import { Card, FieldLabel, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, type HeroSlide } from "@/lib/data/settings";
import { removeImageBackground } from "@/lib/remove-bg";

const inp =
  "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

function SlideRow({
  slide,
  index,
  total,
  uploading,
  bgStatus,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpload,
  onRemoveBg,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  uploading: boolean;
  bgStatus: string | null;
  onUpdate: (patch: Partial<HeroSlide>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpload: (file: File) => void;
  onRemoveBg: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const busy = uploading || bgStatus !== null;

  return (
    <div className="flex gap-4 rounded-2xl border border-line p-4">
      {/* Miniatura + upload */}
      <div className="w-20 shrink-0">
        <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-bg [background-image:linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] [background-position:0_0,0_5px,5px_-5px,-5px_0] [background-size:10px_10px]">
          {slide.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.image} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-stone-bg text-[10px] text-muted">Sin imagen</span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition group-hover:bg-ink/50 group-hover:opacity-100"
            aria-label="Cambiar imagen"
          >
            {uploading ? (
              <Spinner className="text-white" />
            ) : (
              <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] text-ink">Cambiar</span>
            )}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        {/* Quitar fondo (procesa en el navegador y sube el PNG transparente) */}
        <button
          type="button"
          onClick={() => bgFileRef.current?.click()}
          disabled={busy}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg border border-line px-1.5 py-1 text-[10px] text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
          title="Elegí una imagen y le quito el fondo automáticamente"
        >
          <Scissors className="h-3 w-3" /> Quitar fondo
        </button>
        <input
          ref={bgFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onRemoveBg(f);
            e.target.value = "";
          }}
        />
        {bgStatus && <p className="mt-1 text-center text-[9px] leading-tight text-brand">{bgStatus}</p>}
        <p className="mt-1 text-center text-[10px] text-muted">Slide {index + 1}</p>
      </div>

      {/* Campos */}
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <FieldLabel label="Bajada (cursiva)" optional />
            <input
              value={slide.eyebrow ?? ""}
              onChange={(e) => onUpdate({ eyebrow: e.target.value })}
              placeholder="El original"
              className={inp}
            />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel label="Título" required />
            <input
              value={slide.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Brillá siempre"
              className={inp}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <FieldLabel label="Enlace del botón" optional />
          <input
            value={slide.href ?? ""}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="/tienda"
            className={inp}
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-body">
            Visible
            <button type="button" onClick={() => onUpdate({ enabled: !(slide.enabled ?? true) })} tabIndex={-1}>
              <Toggle on={slide.enabled ?? true} />
            </button>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="Subir slide"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label="Bajar slide"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Eliminar slide"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppearanceHero() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia();

  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SETTINGS.hero.slides);
  const [saved, setSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [bgStatus, setBgStatus] = useState<Record<number, string>>({});
  const [bgError, setBgError] = useState("");

  useEffect(() => {
    if (data?.hero?.slides) setSlides(data.hero.slides);
  }, [data]);

  function update(i: number, patch: Partial<HeroSlide>) {
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }
  function remove(i: number) {
    setSlides((s) => s.filter((_, idx) => idx !== i));
  }
  function moveUp(i: number) {
    if (i === 0) return;
    setSlides((s) => {
      const a = [...s];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  }
  function moveDown(i: number) {
    setSlides((s) => {
      if (i >= s.length - 1) return s;
      const a = [...s];
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a;
    });
  }
  function addSlide() {
    setSlides((s) => [
      ...s,
      { title: "", image: "", eyebrow: "", href: "/tienda", enabled: true },
    ]);
  }

  async function handleUpload(i: number, file: File) {
    setUploadingIdx(i);
    try {
      const { url } = await upload.mutateAsync(file);
      update(i, { image: url });
    } finally {
      setUploadingIdx(null);
    }
  }

  // Quita el fondo en el navegador (sin IA en el servidor, sin costo) y sube el PNG.
  async function handleRemoveBg(i: number, file: File) {
    setBgError("");
    setBgStatus((s) => ({ ...s, [i]: "Iniciando…" }));
    try {
      const blob = await removeImageBackground(file, (label) =>
        setBgStatus((s) => ({ ...s, [i]: label })),
      );
      setBgStatus((s) => ({ ...s, [i]: "Subiendo…" }));
      const png = new File([blob], "sin-fondo.png", { type: "image/png" });
      const { url } = await upload.mutateAsync(png);
      update(i, { image: url });
    } catch (e) {
      setBgError("No se pudo quitar el fondo de esa imagen. Probá con otra o subila tal cual.");
    } finally {
      setBgStatus((s) => {
        const next = { ...s };
        delete next[i];
        return next;
      });
    }
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({
      hero: {
        slides: slides.filter((s) => s.title.trim() && s.image.trim()),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card
      title="Slides del hero"
      action={
        <button
          type="button"
          onClick={addSlide}
          className="flex items-center gap-1.5 text-xs font-medium text-brand"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar slide
        </button>
      }
    >
      <p className="mb-1 text-xs text-muted">
        Hacé clic sobre la miniatura para cambiar la imagen (se sube al servidor). Usá las flechas para reordenar.
      </p>
      <p className="mb-4 text-xs text-muted">
        <strong className="text-ink">Quitar fondo:</strong> elegí una foto y el sistema le saca el fondo automáticamente (queda en PNG transparente). Funciona mejor con una figura clara sobre un fondo simple. La primera vez puede tardar unos segundos.
      </p>
      {bgError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{bgError}</p>}
      <div className="flex flex-col gap-3">
        {slides.map((slide, i) => (
          <SlideRow
            key={i}
            slide={slide}
            index={i}
            total={slides.length}
            uploading={uploadingIdx === i}
            bgStatus={bgStatus[i] ?? null}
            onUpdate={(patch) => update(i, patch)}
            onRemove={() => remove(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
            onUpload={(file) => handleUpload(i, file)}
            onRemoveBg={(file) => handleRemoveBg(i, file)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending}
          className="btn-brand px-5 py-2.5 text-xs"
        >
          {save.isPending ? <Spinner /> : "Guardar slides"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
      </div>
    </Card>
  );
}

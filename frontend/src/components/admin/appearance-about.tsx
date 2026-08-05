"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Card, FieldLabel } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";

const DEFAULT_ABOUT = {
  eyebrow: "Colección Unity",
  title: "Ediciones limitadas, hechas para durar",
  paragraphs: [
    "Seleccionamos cada pieza combinando materiales nobles y buena terminación. Joyas pensadas para acompañarte en los momentos que importan —y para regalar lo que no se olvida.",
    "Anillos, collares, aros, pulseras y conjuntos: todo el universo de la joyería, con la calidad y el detalle que nos define.",
  ],
  image1: "/assets/img/about/about-1.jpg",
  image2: "/assets/img/about/about-2.jpg",
  ctaText: "Contactanos",
  ctaHref: "/contacto",
};

type AboutSettings = typeof DEFAULT_ABOUT;

const inp = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

function ImgUpload({
  src,
  uploading,
  onUpload,
  aspectClass = "aspect-[3/4]",
}: {
  src: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  aspectClass?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={`group relative ${aspectClass} w-full overflow-hidden rounded-xl bg-stone-bg`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-[10px] text-muted">Sin imagen</span>
      )}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition group-hover:bg-ink/50 group-hover:opacity-100"
        aria-label="Cambiar imagen"
      >
        {uploading ? (
          <Spinner className="text-white" />
        ) : (
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] text-ink">Cambiar</span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function AppearanceAbout() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia();

  const [about, setAbout] = useState<AboutSettings>(DEFAULT_ABOUT);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"image1" | "image2" | null>(null);

  useEffect(() => {
    if (data?.about) setAbout({ ...DEFAULT_ABOUT, ...data.about });
  }, [data]);

  function patch(update: Partial<AboutSettings>) {
    setAbout((a) => ({ ...a, ...update }));
  }

  function setParagraph(i: number, text: string) {
    setAbout((a) => {
      const paragraphs = [...a.paragraphs];
      paragraphs[i] = text;
      return { ...a, paragraphs };
    });
  }

  async function handleUpload(key: "image1" | "image2", file: File) {
    setUploading(key);
    try {
      const { url } = await upload.mutateAsync(file);
      patch({ [key]: url });
    } finally {
      setUploading(null);
    }
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ about });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Sección Nosotros">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        <div className="flex gap-3">
          <div className="flex-1">
            <ImgUpload
              src={about.image1}
              uploading={uploading === "image1"}
              onUpload={(f) => handleUpload("image1", f)}
            />
          </div>
          <div className="w-16 self-end">
            <ImgUpload
              src={about.image2}
              uploading={uploading === "image2"}
              onUpload={(f) => handleUpload("image2", f)}
              aspectClass="aspect-square"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <FieldLabel label="Bajada" optional />
            <input value={about.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} className={inp} />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel label="Título" required />
            <input value={about.title} onChange={(e) => patch({ title: e.target.value })} className={inp} />
          </label>
          {about.paragraphs.map((p, i) => (
            <label key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink">Párrafo {i + 1}</span>
              <textarea
                rows={2}
                value={p}
                onChange={(e) => setParagraph(i, e.target.value)}
                className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <FieldLabel label="Texto del botón" optional />
              <input value={about.ctaText} onChange={(e) => patch({ ctaText: e.target.value })} className={inp} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel label="Enlace del botón" optional />
              <input value={about.ctaHref} onChange={(e) => patch({ ctaHref: e.target.value })} className={inp} />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending}
          className="btn-brand px-5 py-2.5 text-xs"
        >
          {save.isPending ? <Spinner /> : "Guardar nosotros"}
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

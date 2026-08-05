"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Card, FieldLabel } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";

const DEFAULT_COLLECTION = {
  sideText: "Con nuevo look y nueva colección",
  eyebrow: "Armá tu propio set",
  title: "Nuestras mejores joyas",
  image: "/assets/img/product/collection/4/collection-1.jpg",
  smallImage: "/assets/img/product/collection/4/collection-sm-1.jpg",
  ctaText: "Ver esta colección",
  ctaHref: "/tienda?categoria=conjuntos",
};

type CollectionSettings = typeof DEFAULT_COLLECTION;

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

export function AppearanceCollection() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia();

  const [col, setCol] = useState<CollectionSettings>(DEFAULT_COLLECTION);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"image" | "smallImage" | null>(null);

  useEffect(() => {
    if (data?.collection) setCol({ ...DEFAULT_COLLECTION, ...data.collection });
  }, [data]);

  function patch(update: Partial<CollectionSettings>) {
    setCol((c) => ({ ...c, ...update }));
  }

  async function handleUpload(key: "image" | "smallImage", file: File) {
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
    await save.mutateAsync({ collection: col });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Colección destacada">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div className="flex gap-3">
          <div className="flex-1">
            <ImgUpload
              src={col.image}
              uploading={uploading === "image"}
              onUpload={(f) => handleUpload("image", f)}
            />
          </div>
          <div className="flex-1">
            <ImgUpload
              src={col.smallImage}
              uploading={uploading === "smallImage"}
              onUpload={(f) => handleUpload("smallImage", f)}
              aspectClass="aspect-square"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <FieldLabel label="Texto vertical lateral" optional />
            <input value={col.sideText} onChange={(e) => patch({ sideText: e.target.value })} className={inp} />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel label="Bajada" optional />
            <input value={col.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} className={inp} />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel label="Título" required />
            <input value={col.title} onChange={(e) => patch({ title: e.target.value })} className={inp} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <FieldLabel label="Texto del enlace" optional />
              <input value={col.ctaText} onChange={(e) => patch({ ctaText: e.target.value })} className={inp} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel label="Enlace" optional />
              <input value={col.ctaHref} onChange={(e) => patch({ ctaHref: e.target.value })} className={inp} />
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
          {save.isPending ? <Spinner /> : "Guardar colección"}
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

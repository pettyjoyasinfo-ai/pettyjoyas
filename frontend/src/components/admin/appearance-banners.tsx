"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Card, FieldLabel, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";

const SLOT_LABELS: Record<string, string> = {
  "principal": "Principal",
  "chico-1": "Chico 1",
  "chico-2": "Chico 2",
  "alto": "Alto",
};

const DEFAULT_BANNERS = [
  { id: "ban-1", eyebrow: "Colección",     title: "Anillos Art Déco 2024",        image: "/assets/img/banner/4/banner-1.jpg", href: "/tienda?categoria=anillos",    cta: true,  slot: "principal" },
  { id: "ban-2", eyebrow: "Tendencia",      title: "Conjuntos coordinados",        image: "/assets/img/banner/4/banner-2.jpg", href: "/tienda?categoria=conjuntos", cta: false, slot: "chico-1" },
  { id: "ban-3", eyebrow: "Recién llegado", title: "Joyas en oro",                 image: "/assets/img/banner/4/banner-3.jpg", href: "/tienda?material=oro",        cta: false, slot: "chico-2" },
  { id: "ban-4", eyebrow: "Colección",      title: "Anillos de oro con diamantes", image: "/assets/img/banner/4/banner-4.jpg", href: "/tienda?categoria=anillos",    cta: true,  slot: "alto" },
];

type BannerItem = typeof DEFAULT_BANNERS[number];

const inp = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

function BannerRow({
  banner,
  uploading,
  onUpdate,
  onUpload,
}: {
  banner: BannerItem;
  uploading: boolean;
  onUpdate: (patch: Partial<BannerItem>) => void;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-4 rounded-2xl border border-line p-4">
      <div className="w-28 shrink-0">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-bg">
          {banner.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[10px] text-muted">Sin imagen</span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
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
        <p className="mt-1 text-center text-[10px] text-muted">{SLOT_LABELS[banner.slot] ?? banner.slot}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <FieldLabel label="Etiqueta" optional />
          <input value={banner.eyebrow} onChange={(e) => onUpdate({ eyebrow: e.target.value })} className={inp} />
        </label>
        <label className="flex flex-col gap-1">
          <FieldLabel label="Título" required />
          <input value={banner.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inp} />
        </label>
        <label className="flex flex-col gap-1">
          <FieldLabel label="Enlace" optional />
          <input value={banner.href} onChange={(e) => onUpdate({ href: e.target.value })} className={inp} />
        </label>
        <span className="flex items-center gap-2 pt-1 text-xs text-body">
          Mostrar botón "Comprar ahora"
          <button type="button" onClick={() => onUpdate({ cta: !banner.cta })} tabIndex={-1}>
            <Toggle on={banner.cta} />
          </button>
        </span>
      </div>
    </div>
  );
}

export function AppearanceBanners() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia();

  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);
  const [saved, setSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (data?.banners?.items?.length) setBanners(data.banners.items);
  }, [data]);

  function update(i: number, patch: Partial<BannerItem>) {
    setBanners((b) => b.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
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

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ banners: { items: banners } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Banners de la home">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {banners.map((b, i) => (
          <BannerRow
            key={b.slot}
            banner={b}
            uploading={uploadingIdx === i}
            onUpdate={(patch) => update(i, patch)}
            onUpload={(file) => handleUpload(i, file)}
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
          {save.isPending ? <Spinner /> : "Guardar banners"}
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

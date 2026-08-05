"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Card, FieldLabel } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings, useUploadMedia } from "@/lib/api/admin";

const DEFAULT: NosotrosSettings = {
  eyebrow: "Nuestra historia",
  title: "Joyas que cuentan historias",
  paragraphs: [
    "Petty Joyas es una joyería con base en Puerto Iguazú y más de 30 años de trayectoria. Creemos que una joya no es solo un accesorio: es un recuerdo, un regalo, una forma de expresar quién sos.",
    "Seleccionamos piezas de calidad en oro y plata para que siempre encuentres algo que te represente, ya sea para vos o para regalar.",
  ],
  image: "/assets/img/about/about-1.jpg",
};

type NosotrosSettings = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image: string;
};

const inp = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

export function AppearanceNosotros() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const upload = useUploadMedia();

  const [form, setForm] = useState<NosotrosSettings>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.nosotros) setForm({ ...DEFAULT, ...data.nosotros });
  }, [data]);

  function patch(update: Partial<NosotrosSettings>) {
    setForm((f) => ({ ...f, ...update }));
  }

  function setParagraph(i: number, text: string) {
    setForm((f) => {
      const paragraphs = [...f.paragraphs];
      paragraphs[i] = text;
      return { ...f, paragraphs };
    });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await upload.mutateAsync(file);
      patch({ image: url });
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ nosotros: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Página Nosotros">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">

        {/* Imagen */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Imagen</p>
          <div
            className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-xl bg-stone-bg"
            onClick={() => fileRef.current?.click()}
          >
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[10px] text-muted">Sin imagen</span>
            )}
            <div className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition group-hover:bg-ink/50 group-hover:opacity-100">
              {uploading ? (
                <Spinner className="text-white" />
              ) : (
                <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] text-ink">Cambiar</span>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
          />
        </div>

        {/* Textos */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <FieldLabel label="Etiqueta" optional />
            <input
              value={form.eyebrow}
              onChange={(e) => patch({ eyebrow: e.target.value })}
              placeholder="Nuestra historia"
              className={inp}
            />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel label="Título" required />
            <input
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Joyas que cuentan historias"
              className={inp}
            />
          </label>
          {form.paragraphs.map((p, i) => (
            <label key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink">Párrafo {i + 1}</span>
              <textarea
                rows={3}
                value={p}
                onChange={(e) => setParagraph(i, e.target.value)}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending || !form.title.trim()}
          className="btn-brand px-5 py-2.5 text-xs disabled:opacity-50"
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

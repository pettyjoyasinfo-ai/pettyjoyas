"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Card, FieldLabel } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";

const MAX_POSTS = 6;
const inp = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";
const POST_URL_PATTERN = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[^\s]+$/i;

export function AppearanceInstagram() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();

  const [urls, setUrls] = useState<string[]>(DEFAULT_SETTINGS.instagram.urls);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.instagram?.urls) setUrls(data.instagram.urls);
  }, [data]);

  function update(i: number, value: string) {
    setUrls((u) => u.map((url, idx) => (idx === i ? value : url)));
  }
  function remove(i: number) {
    setUrls((u) => u.filter((_, idx) => idx !== i));
  }
  function moveUp(i: number) {
    if (i === 0) return;
    setUrls((u) => {
      const a = [...u];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  }
  function moveDown(i: number) {
    setUrls((u) => {
      if (i >= u.length - 1) return u;
      const a = [...u];
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a;
    });
  }
  function addPost() {
    setUrls((u) => (u.length >= MAX_POSTS ? u : [...u, ""]));
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({
      instagram: { urls: urls.map((u) => u.trim()).filter(Boolean) },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card
      title="Galería de Instagram"
      action={
        <button
          type="button"
          onClick={addPost}
          disabled={urls.length >= MAX_POSTS}
          className="flex items-center gap-1.5 text-xs font-medium text-brand disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar post
        </button>
      }
    >
      <p className="mb-4 text-xs text-muted">
        Pegá el link de cada publicación de Instagram (hasta {MAX_POSTS}), en el orden en que querés mostrarlas.
        Se obtiene desde la app: abrí el post → "..." → "Copiar enlace".
      </p>

      {urls.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
          Sin publicaciones cargadas todavía.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {urls.map((url, i) => {
          const invalid = url.trim() !== "" && !POST_URL_PATTERN.test(url.trim());
          return (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-line p-3">
              <span className="mt-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-bg text-[11px] font-medium text-muted">
                {i + 1}
              </span>
              <label className="flex flex-1 flex-col gap-1">
                <FieldLabel label={`Link del post ${i + 1}`} required />
                <input
                  value={url}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder="https://www.instagram.com/p/XXXXXXXXXXX/"
                  className={inp}
                />
                {invalid && (
                  <span className="text-[11px] text-red-600">No parece un link válido de un post de Instagram.</span>
                )}
              </label>
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label="Subir"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === urls.length - 1}
                  aria-label="Bajar"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-ink disabled:opacity-25"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Eliminar"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending}
          className="btn-brand px-5 py-2.5 text-xs"
        >
          {save.isPending ? <Spinner /> : "Guardar Instagram"}
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

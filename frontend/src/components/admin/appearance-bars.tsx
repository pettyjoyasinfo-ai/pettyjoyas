"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Card, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, type AnnouncementItem, type FeatureItem } from "@/lib/data/settings";
import { ICON_NAMES, resolveIcon } from "@/lib/icons";

const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

/** Selector de ícono: muestra el ícono elegido + un <select> con el set del sistema. */
function IconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  const Icon = resolveIcon(value);
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-bg text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${inp} w-36`} aria-label="Ícono">
        {ICON_NAMES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </span>
  );
}

export function AppearanceBars() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();

  const [announcement, setAnnouncement] = useState(DEFAULT_SETTINGS.announcement);
  const [features, setFeatures] = useState(DEFAULT_SETTINGS.features);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setAnnouncement(data.announcement ?? DEFAULT_SETTINGS.announcement);
      setFeatures(data.features ?? DEFAULT_SETTINGS.features);
    }
  }, [data]);

  // ── Barra superior ──
  function setAnnItem(i: number, patch: Partial<AnnouncementItem>) {
    setAnnouncement((a) => ({ ...a, items: a.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  }
  function addAnnItem() {
    setAnnouncement((a) => ({ ...a, items: [...a.items, { icon: "Sparkles", text: "" }] }));
  }
  function removeAnnItem(i: number) {
    setAnnouncement((a) => ({ ...a, items: a.items.filter((_, idx) => idx !== i) }));
  }

  // ── Barra de beneficios ──
  function setFeatItem(i: number, patch: Partial<FeatureItem>) {
    setFeatures((f) => ({ ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  }
  function addFeatItem() {
    setFeatures((f) => ({ ...f, items: [...f.items, { icon: "Star", title: "", text: "" }] }));
  }
  function removeFeatItem(i: number) {
    setFeatures((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({
      announcement: { ...announcement, items: announcement.items.filter((i) => i.text.trim()) },
      features: { ...features, items: features.items.filter((i) => i.title.trim()) },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <div className="flex flex-col gap-6">
      {/* BARRA SUPERIOR */}
      <Card
        title="Barra superior (fondo negro, arriba del header)"
        action={
          <span className="flex items-center gap-2 text-xs text-body">
            Visible <button onClick={() => setAnnouncement((a) => ({ ...a, enabled: !a.enabled }))}><Toggle on={announcement.enabled} /></button>
          </span>
        }
      >
        <p className="mb-4 text-xs text-muted">El primer mensaje se ve siempre; el resto aparece en pantallas medianas o más grandes.</p>
        <div className="flex flex-col gap-3">
          {announcement.items.map((item, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-line p-3">
              <IconPicker value={item.icon} onChange={(icon) => setAnnItem(i, { icon })} />
              <input
                value={item.text}
                onChange={(e) => setAnnItem(i, { text: e.target.value })}
                placeholder="Envío gratis desde $80.000"
                className={`${inp} min-w-0 flex-1`}
              />
              <button onClick={() => removeAnnItem(i)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600" aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={addAnnItem} className="flex items-center gap-1.5 self-start rounded-full border border-dashed border-line px-4 py-2 text-xs text-muted transition hover:border-brand hover:text-brand">
            <Plus className="h-3.5 w-3.5" /> Agregar mensaje
          </button>
        </div>
      </Card>

      {/* BARRA DE BENEFICIOS */}
      <Card title="Barra de beneficios (debajo del hero)">
        <p className="mb-4 text-xs text-muted">Ícono + título + bajada. Se muestran en una grilla de hasta 4 columnas.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {features.items.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-line p-3">
              <IconPicker value={item.icon} onChange={(icon) => setFeatItem(i, { icon })} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input value={item.title} onChange={(e) => setFeatItem(i, { title: e.target.value })} placeholder="Título (ej. Envío a todo el país)" className={inp} />
                <input value={item.text ?? ""} onChange={(e) => setFeatItem(i, { text: e.target.value })} placeholder="Bajada (opcional)" className={inp} />
              </div>
              <button onClick={() => removeFeatItem(i)} className="grid h-10 w-10 shrink-0 place-items-center self-start rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600" aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addFeatItem} className="mt-3 flex items-center gap-1.5 rounded-full border border-dashed border-line px-4 py-2 text-xs text-muted transition hover:border-brand hover:text-brand">
          <Plus className="h-3.5 w-3.5" /> Agregar beneficio
        </button>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={save.isPending} className="btn-brand px-5 py-2.5 text-xs">
          {save.isPending ? <Spinner /> : "Guardar barras"}
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-700"><Check className="h-4 w-4" /> Guardado</span>}
      </div>
    </div>
  );
}

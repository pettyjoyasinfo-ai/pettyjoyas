"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card, Toggle } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, type BadgeSettings } from "@/lib/data/settings";

const BADGE_META: { key: keyof BadgeSettings; label: string; description: string; color: string }[] = [
  {
    key: "nuevo",
    label: "Nuevo",
    description: "Aparece automáticamente en productos creados en los últimos 7 días.",
    color: "bg-ink text-white",
  },
  {
    key: "oferta",
    label: "Oferta",
    description: "Aparece cuando el producto tiene precio tachado o descuento activo.",
    color: "bg-brand text-white",
  },
  {
    key: "destacado",
    label: "Destacado",
    description: "Se asigna manualmente desde el formulario de producto.",
    color: "bg-gold text-ink",
  },
  {
    key: "agotado",
    label: "Agotado",
    description: "Aparece automáticamente cuando el stock llega a cero.",
    color: "bg-muted text-white",
  },
];

export function AppearanceBadges() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  const [badges, setBadges] = useState<BadgeSettings>(DEFAULT_SETTINGS.badges);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.badges) setBadges({ ...DEFAULT_SETTINGS.badges, ...data.badges });
  }, [data]);

  function toggle(key: keyof BadgeSettings) {
    setBadges((b) => ({ ...b, [key]: !b[key] }));
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ badges });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Badges en tarjetas de producto">
      <p className="mb-5 text-xs text-muted">
        Activá o desactivá cada badge. Los cambios se reflejan en la tienda al instante.
      </p>
      <div className="flex flex-col gap-3">
        {BADGE_META.map(({ key, label, description, color }) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-2xl border border-line p-4"
          >
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${color}`}
            >
              {label}
            </span>
            <p className="flex-1 text-sm text-body">{description}</p>
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-label={badges[key] ? `Desactivar ${label}` : `Activar ${label}`}
            >
              <Toggle on={badges[key]} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={save.isPending}
          className="btn-brand px-5 py-2.5 text-xs"
        >
          {save.isPending ? <Spinner /> : "Guardar badges"}
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

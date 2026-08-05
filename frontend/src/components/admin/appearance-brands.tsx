"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Card, FieldLabel } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSettings } from "@/lib/api/admin";
import { DEFAULT_SETTINGS, type BrandItem } from "@/lib/data/settings";

const inp = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

export function AppearanceBrands() {
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();

  const [heading, setHeading] = useState(DEFAULT_SETTINGS.brands.heading);
  const [items, setItems] = useState<BrandItem[]>(DEFAULT_SETTINGS.brands.items);
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.brands) {
      setHeading(data.brands.heading ?? DEFAULT_SETTINGS.brands.heading);
      if (data.brands.items?.length) setItems(data.brands.items);
    }
  }, [data]);

  function remove(id: string) {
    setItems((prev) => prev.filter((b) => b.id !== id));
  }

  function add() {
    const name = newName.trim();
    if (!name) return;
    setItems((prev) => [
      ...prev,
      { id: `b-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`, name: name.toUpperCase() },
    ]);
    setNewName("");
  }

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ brands: { heading, items } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) return <Spinner className="text-brand" />;

  return (
    <Card title="Carrusel de marcas">
      {/* Título de la sección */}
      <div className="mb-5 max-w-md">
        <label className="flex flex-col gap-1.5">
          <FieldLabel label="Título de la sección" optional />
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className={inp}
          />
        </label>
      </div>

      {/* Lista de marcas */}
      <div className="mb-4 flex flex-wrap gap-2">
        {items.map((b) => (
          <span
            key={b.id}
            className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-2 text-sm font-medium text-ink"
          >
            {b.name}
            <button
              type="button"
              onClick={() => remove(b.id)}
              aria-label={`Quitar ${b.name}`}
              className="grid h-5 w-5 place-items-center rounded-full text-muted transition hover:bg-stone-bg hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Agregar nueva marca */}
      <div className="mb-5 flex max-w-xs gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ej: OMEGA"
          className={inp}
        />
        <button
          type="button"
          onClick={add}
          disabled={!newName.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-brand px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending}
          className="btn-brand px-5 py-2.5 text-xs"
        >
          {save.isPending ? <Spinner /> : "Guardar marcas"}
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

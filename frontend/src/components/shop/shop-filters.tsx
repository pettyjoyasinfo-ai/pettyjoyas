"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const PRICE_PRESETS = [
  { label: "Hasta $50.000", min: "", max: "50000" },
  { label: "$50.000 – $100.000", min: "50000", max: "100000" },
  { label: "$100.000 – $180.000", min: "100000", max: "180000" },
  { label: "Más de $180.000", min: "180000", max: "" },
];

function Section({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink">
          {title}
          {!!count && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-[600px] pb-4 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Builds tree: roots = categories without parentSlug, children grouped by parentSlug */
function buildTree(categories: Category[]): { root: Category; children: Category[] }[] {
  const roots = categories.filter((c) => !c.parentSlug);
  const byParent: Record<string, Category[]> = {};
  for (const c of categories) {
    if (c.parentSlug) {
      byParent[c.parentSlug] ??= [];
      byParent[c.parentSlug].push(c);
    }
  }
  return roots.map((r) => ({ root: r, children: byParent[r.slug] ?? [] }));
}

export function ShopFilters({
  categories,
  materials,
  onApply,
}: {
  categories: Category[];
  materials: string[];
  onApply?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = {
    categoria: searchParams.get("categoria") ?? "",
    material: searchParams.get("material") ?? "",
    min: searchParams.get("min") ?? "",
    max: searchParams.get("max") ?? "",
    oferta: searchParams.get("oferta") ?? "",
  };

  const [customMin, setCustomMin] = useState(current.min);
  const [customMax, setCustomMax] = useState(current.max);

  const tree = useMemo(() => buildTree(categories), [categories]);

  // Determine which parents should auto-expand (current slug is a child of them)
  const currentCat = categories.find((c) => c.slug === current.categoria);
  const defaultExpanded = useMemo(() => {
    const set: Record<string, boolean> = {};
    if (currentCat?.parentSlug) set[currentCat.parentSlug] = true;
    // Also expand if current categoria IS a root that has children
    for (const { root } of tree) {
      if (current.categoria === root.slug) set[root.slug] = true;
    }
    return set;
  }, [currentCat, tree, current.categoria]);

  // Track expanded parents: slug → boolean
  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded);

  function toggleParent(slug: string) {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  const update = useCallback(
    (entries: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
      onApply?.();
    },
    [router, pathname, searchParams, onApply],
  );

  const hasFilters = current.categoria || current.material || current.min || current.max || current.oferta;
  const filterCount = [current.categoria, current.material, current.min || current.max, current.oferta].filter(Boolean).length;

  function applyCustomPrice() {
    update({ min: customMin || null, max: customMax || null });
  }

  const catCount = current.categoria ? 1 : 0;
  const priceCount = current.min || current.max ? 1 : 0;
  const matCount = current.material ? 1 : 0;
  const ofertaCount = current.oferta ? 1 : 0;

  return (
    <div className="flex flex-col">
      {/* Limpiar todo */}
      {hasFilters && (
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs text-muted">
            {filterCount} filtro{filterCount > 1 ? "s" : ""} aplicado{filterCount > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              router.push(pathname);
              setCustomMin("");
              setCustomMax("");
              onApply?.();
            }}
            className="text-xs font-medium text-brand hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Categorías */}
      <Section title="Categoría" count={catCount}>
        <ul className="flex flex-col gap-0.5">
          {/* Todas */}
          <li>
            <button
              onClick={() => update({ categoria: null })}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-bg",
                !current.categoria ? "font-semibold text-brand" : "text-body",
              )}
            >
              Todas las categorías
            </button>
          </li>

          {tree.map(({ root, children }) => {
            const rootActive = current.categoria === root.slug;
            const childActive = children.some((c) => c.slug === current.categoria);
            const isOpen = !!expanded[root.slug];

            return (
              <li key={root.slug}>
                <div className="flex items-center">
                  <button
                    onClick={() => update({ categoria: root.slug })}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-bg",
                      rootActive
                        ? "font-semibold text-brand"
                        : childActive
                          ? "font-medium text-ink"
                          : "text-body",
                    )}
                  >
                    {root.name}
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() => toggleParent(root.slug)}
                      aria-label={isOpen ? "Colapsar subcategorías" : "Ver subcategorías"}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-stone-bg hover:text-ink"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isOpen && "rotate-90",
                        )}
                      />
                    </button>
                  )}
                </div>

                {/* Subcategorías */}
                {children.length > 0 && (
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <ul className="ml-4 flex flex-col gap-0.5 border-l border-line pl-2 pt-0.5">
                      {children.map((sub) => (
                        <li key={sub.slug}>
                          <button
                            onClick={() => update({ categoria: sub.slug })}
                            className={cn(
                              "w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-stone-bg",
                              current.categoria === sub.slug
                                ? "font-semibold text-brand"
                                : "text-body",
                            )}
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Precio */}
      <Section title="Precio" count={priceCount}>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRICE_PRESETS.map((r) => {
            const active = r.min === current.min && r.max === current.max;
            return (
              <button
                key={r.label}
                onClick={() => {
                  setCustomMin(r.min);
                  setCustomMax(r.max);
                  update({ min: r.min || null, max: r.max || null });
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line text-body hover:border-brand hover:text-brand",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Rango personalizado
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín $"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustomPrice()}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            placeholder="Máx $"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustomPrice()}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={applyCustomPrice}
          className="mt-2.5 w-full rounded-lg border border-brand py-2 text-xs font-medium text-brand transition hover:bg-brand hover:text-white"
        >
          Aplicar rango
        </button>
      </Section>

      {/* Material */}
      {materials.length > 0 && (
        <Section title="Material" count={matCount}>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <button
                key={m}
                onClick={() => update({ material: current.material === m ? null : m })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  current.material === m
                    ? "border-brand bg-brand text-white"
                    : "border-line text-body hover:border-brand hover:text-ink",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Ofertas */}
      <Section title="Promociones" count={ofertaCount}>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-body">
          <div
            onClick={() => update({ oferta: current.oferta === "1" ? null : "1" })}
            className={cn(
              "relative h-5 w-9 cursor-pointer rounded-full transition-colors duration-200",
              current.oferta === "1" ? "bg-brand" : "bg-line",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                current.oferta === "1" ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </div>
          Solo productos en oferta
        </label>
      </Section>
    </div>
  );
}

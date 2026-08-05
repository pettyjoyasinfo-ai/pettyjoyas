"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ShopFilters } from "@/components/shop/shop-filters";
import type { Category } from "@/lib/types";

function FilterCount() {
  const sp = useSearchParams();
  const count = [
    sp.get("categoria"),
    sp.get("material"),
    sp.get("min") || sp.get("max"),
    sp.get("oferta"),
  ].filter(Boolean).length;
  if (!count) return null;
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
      {count}
    </span>
  );
}

export function MobileFilterDrawer({
  categories,
  materials,
}: {
  categories: Category[];
  materials: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-brand hover:text-brand lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        <FilterCount />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(340px,90vw)] flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-display text-xl text-ink">Filtros</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-stone-bg"
          >
            <X className="h-4 w-4 text-ink" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ShopFilters
            categories={categories}
            materials={materials}
            onApply={() => setOpen(false)}
          />
        </div>
        <div className="border-t border-line p-4">
          <button
            onClick={() => setOpen(false)}
            className="btn-brand w-full"
          >
            Ver productos
          </button>
        </div>
      </div>
    </>
  );
}

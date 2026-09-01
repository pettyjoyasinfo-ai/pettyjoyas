"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { useProducts } from "@/lib/api/queries";
import { visibleCategories } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

export function ProductTabs({
  categories,
  initialProducts,
}: {
  categories: Category[];
  initialProducts: Product[];
}) {
  const [active, setActive] = useState<string>("");
  // limit: 8 = lo que muestra esta sección. Sin esto, cada clic en una
  // pestaña descargaba todos los productos de esa categoría para tirar 8.
  const { data, isFetching, isError } = useProducts(
    active ? { category: active, limit: 8 } : { limit: 8 },
  );
  // `initialProducts` (los de "Todas") solo se usan como fallback cuando esa
  // es la pestaña activa. Antes se usaban SIEMPRE que `data` no estuviera
  // disponible — si el fetch de una categoría fallaba o tardaba, la pestaña
  // quedaba marcada como seleccionada pero mostrando los productos de
  // "Todas" en silencio, sin ningún aviso (se veía como "el filtro no
  // funciona").
  const products = (active ? data : (data ?? initialProducts))?.slice(0, 8) ?? [];
  const showEmpty = !isFetching && !isError && products.length === 0;

  const roots = visibleCategories(categories).filter((c) => !c.parentSlug).slice(0, 11);
  const tabs = [{ slug: "", name: "Todas" }, ...roots.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <section className="container-px py-20">
      <div className="mb-10 flex flex-col items-center gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
        <div>
          <span className="section-subtitle">Colección de productos</span>
          <h2 className="section-title mt-2">Descubrí nuestras joyas</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => setActive(tab.slug)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active === tab.slug
                  ? "bg-ink text-white"
                  : "bg-stone-bg text-ink hover:bg-khaki-200",
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("transition-opacity", isFetching && "opacity-60")}>
        {isError ? (
          <p className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted">
            No pudimos cargar estos productos. Probá de nuevo en un momento.
          </p>
        ) : isFetching && products.length === 0 ? (
          <div className="flex justify-center py-16 text-muted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : showEmpty ? (
          <p className="py-16 text-center text-sm text-muted">Todavía no hay productos en esta categoría.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <div className="mt-12 text-center">
        <Link href="/tienda" className="btn-outline inline-flex">
          Ver toda la tienda <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

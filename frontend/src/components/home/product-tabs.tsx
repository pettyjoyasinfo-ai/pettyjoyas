"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { useProducts } from "@/lib/api/queries";
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
  const { data, isFetching } = useProducts(active ? { category: active } : {});
  const products = (data ?? initialProducts).slice(0, 8);

  const roots = categories.filter((c) => !c.parentSlug).slice(0, 11);
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
        <ProductGrid products={products} />
      </div>

      <div className="mt-12 text-center">
        <Link href="/tienda" className="btn-outline inline-flex">
          Ver toda la tienda <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

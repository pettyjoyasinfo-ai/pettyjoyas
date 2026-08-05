import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductGrid } from "@/components/product/product-grid";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ShopSort } from "@/components/shop/shop-sort";
import { MobileFilterDrawer } from "@/components/shop/mobile-filter-drawer";
import {
  getCategories,
  getMaterials,
  getProducts,
  type ProductFilters,
} from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Explorá toda la colección de Petty Joyas: anillos, collares, aros y más.",
};

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function TiendaPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  const filters: ProductFilters = {
    category: str(sp.categoria),
    collection: str(sp.coleccion),
    material: str(sp.material),
    minPrice: sp.min ? Number(str(sp.min)) : undefined,
    maxPrice: sp.max ? Number(str(sp.max)) : undefined,
    onSale: str(sp.oferta) === "1",
    search: str(sp.q),
    sort: (str(sp.orden) as ProductFilters["sort"]) ?? "relevancia",
    promo: str(sp.promo),
  };

  const [products, categories, materials] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getMaterials(),
  ]);

  const activeCat = categories.find((c) => c.slug === filters.category);
  const heading = activeCat?.name ?? (filters.search ? `"${filters.search}"` : "Tienda");

  return (
    <div className="container-px py-8">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Tienda", href: "/tienda" },
          ...(activeCat ? [{ label: activeCat.name }] : []),
        ]}
      />

      <header className="mt-6 mb-8 max-w-2xl">
        <h1 className="font-display text-4xl text-ink">{heading}</h1>
        <p className="mt-2 text-sm text-body">
          {activeCat?.description ??
            "Joyas de calidad en oro y plata. Filtrá por categoría, precio y material."}
        </p>
      </header>

      {/* Barra superior mobile: filtros + orden */}
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <Suspense fallback={null}>
          <MobileFilterDrawer categories={categories} materials={materials} />
        </Suspense>
        <div className="flex-1" />
        <Suspense fallback={null}>
          <ShopSort />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Suspense fallback={null}>
              <ShopFilters categories={categories} materials={materials} />
            </Suspense>
          </div>
        </aside>

        <div>
          {/* Barra superior desktop: conteo + orden */}
          <div className="mb-6 hidden items-center justify-between gap-4 border-b border-line pb-4 lg:flex">
            <p className="text-sm text-muted">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"}
            </p>
            <Suspense fallback={null}>
              <ShopSort />
            </Suspense>
          </div>

          {/* Conteo mobile */}
          <p className="mb-4 text-sm text-muted lg:hidden">
            {products.length}{" "}
            {products.length === 1 ? "producto" : "productos"}
          </p>

          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}

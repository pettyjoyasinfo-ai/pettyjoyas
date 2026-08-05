"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductGrid } from "@/components/product/product-grid";
import { LoadingScreen } from "@/components/ui/spinner";
import { useFavorites } from "@/lib/api/account";
import { useAuth } from "@/lib/auth/store";

export default function FavoritosPage() {
  const { user, hydrated } = useAuth();
  const { data: favorites = [], isLoading } = useFavorites();

  if (!hydrated) return <LoadingScreen />;

  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Favoritos" }]} />
      <h1 className="mt-6 mb-2 font-display text-4xl text-ink">Tus favoritos</h1>

      {!user ? (
        <div className="mt-6 flex flex-col items-center gap-5 rounded-3xl border border-dashed border-line py-20 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-stone-bg text-muted"><Heart className="h-8 w-8" /></span>
          <p className="text-body">Iniciá sesión para guardar y ver tus productos favoritos.</p>
          <Link href="/cuenta?next=/favoritos" className="btn-brand">Iniciar sesión</Link>
        </div>
      ) : isLoading ? (
        <LoadingScreen />
      ) : favorites.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-5 rounded-3xl border border-dashed border-line py-20 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-stone-bg text-muted"><Heart className="h-8 w-8" /></span>
          <p className="text-body">Todavía no guardaste favoritos. Tocá el ♥ en cualquier producto.</p>
          <Link href="/tienda" className="btn-brand">Explorar la tienda</Link>
        </div>
      ) : (
        <>
          <p className="mb-8 text-sm text-body">{favorites.length} productos guardados.</p>
          <ProductGrid products={favorites} />
        </>
      )}
    </div>
  );
}

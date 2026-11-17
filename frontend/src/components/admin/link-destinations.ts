"use client";

import { useAdminCategories } from "@/lib/api/admin";

export type LinkDestination = { label: string; href: string };

/**
 * Destinos listos para los links del panel (flyers, imágenes del hero): toda la tienda,
 * ofertas y cada categoría. Así no hay que escribir el link a mano.
 */
export function useLinkDestinations(): LinkDestination[] {
  const { data: categories = [] } = useAdminCategories();
  return [
    { label: "Toda la tienda", href: "/tienda" },
    { label: "Productos en oferta", href: "/tienda?oferta=1" },
    ...categories
      .filter((c: any) => c.slug)
      .map((c: any) => ({
        label: c.parentSlug
          ? `${categories.find((p: any) => p.slug === c.parentSlug)?.name ?? c.parentSlug} › ${c.name}`
          : c.name,
        href: `/tienda?categoria=${c.slug}`,
      }))
      .sort((a: LinkDestination, b: LinkDestination) => a.label.localeCompare(b.label, "es")),
  ];
}

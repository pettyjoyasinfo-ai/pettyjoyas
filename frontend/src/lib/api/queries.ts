"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts } from "@/lib/api/catalog";
import type { ProductFilters } from "@/lib/data/products";
import type { Category } from "@/lib/types";

/** Claves de cache de React Query. */
export const queryKeys = {
  products: (filters: ProductFilters = {}) => ["products", filters] as const,
  categories: () => ["categories"] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => fetchProducts(filters),
  });
}

/**
 * `initialCategories` viene del servidor (el layout ya las pide para el
 * footer): con eso el menú se pinta al instante y el navegador no vuelve a
 * pedirlas a la API en cada visita. Si no llegan (la API falló al generar la
 * página), se piden desde el navegador como antes.
 */
export function useCategories(initialCategories?: Category[]) {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => fetchCategories(),
    staleTime: 1000 * 60 * 60,
    initialData: initialCategories,
  });
}

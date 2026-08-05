"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts } from "@/lib/api/catalog";
import type { ProductFilters } from "@/lib/data/products";

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

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => fetchCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

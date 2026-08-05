"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

export type LiveStock = {
  product_id: string;
  stock: number;
  /** Mapa { [variantId]: stock }. */
  by_variant: Record<string, number>;
};

/**
 * Stock en vivo de un producto. Hace polling al backend (que deriva el stock de
 * los movimientos de inventario), así la disponibilidad se mantiene actualizada
 * mientras el cliente mira la ficha — y se refleja en cualquier dispositivo,
 * porque cada uno consulta la misma fuente de verdad.
 */
export function useProductStock(productId: string) {
  return useQuery({
    queryKey: ["stock", productId],
    queryFn: () => apiFetch<LiveStock>(`/inventory/stock?product_id=${productId}`),
    enabled: isApiConfigured() && !!productId,
    refetchInterval: 10000, // refresca cada 10 s (reservas de carrito se reflejan rápido)
    refetchOnWindowFocus: true, // y al volver a la pestaña
    staleTime: 10000,
  });
}

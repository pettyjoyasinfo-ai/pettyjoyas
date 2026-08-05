import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

/**
 * Aviso visible para una línea del carrito según su estado de validación
 * (calculado en el backend contra el stock/precio/disponibilidad vivos).
 */
export function itemNotice(item: CartItem): { text: string; tone: "warn" | "danger" } | null {
  switch (item.status) {
    case "unavailable":
      return { text: "Ya no está disponible", tone: "danger" };
    case "out_of_stock":
      return { text: "Sin stock por el momento", tone: "danger" };
    case "adjusted":
      return {
        text: `Solo quedan ${item.availableStock ?? item.maxStock} · ajustamos la cantidad`,
        tone: "warn",
      };
    case "price_changed":
      return {
        text: item.previousPrice
          ? `El precio cambió (antes ${formatPrice(item.previousPrice)})`
          : "El precio cambió",
        tone: "warn",
      };
    default:
      return null;
  }
}

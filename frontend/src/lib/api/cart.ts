"use client";

import { apiFetch } from "@/lib/api/client";

export type CartLineStatus =
  | "ok"
  | "adjusted"
  | "out_of_stock"
  | "price_changed"
  | "unavailable";

export type ServerCartItem = {
  id: number | null;
  productId: string;
  variantId: string | null;
  slug: string | null;
  name: string;
  image: string | null;
  variantLabel: string | null;
  quantity: number;
  requestedQuantity: number;
  price: number;
  previousPrice: number | null;
  lineTotal: number;
  availableStock: number;
  maxStock: number;
  status: CartLineStatus;
  reservedUntil?: string | null;
};

export type CartSnapshot = {
  items: ServerCartItem[];
  subtotal: number;
  issues: CartLineStatus[];
  hasBlockingIssues: boolean;
};

/** Ítem mínimo que el frontend envía al backend (merge / validate). */
export type CartItemInput = {
  product_id: number;
  product_variant_id?: number | null;
  quantity: number;
  price?: number;
};

/** Wrappers del carrito persistente (requieren sesión, salvo `validate`). */
export const cartApi = {
  get: () => apiFetch<CartSnapshot>("/cart"),
  add: (body: { product_id: number; product_variant_id?: number | null; quantity: number }) =>
    apiFetch<CartSnapshot>("/cart/items", { method: "POST", body: JSON.stringify(body) }),
  setQty: (id: number, quantity: number) =>
    apiFetch<CartSnapshot>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  remove: (id: number) => apiFetch<CartSnapshot>(`/cart/items/${id}`, { method: "DELETE" }),
  clear: () => apiFetch<CartSnapshot>("/cart", { method: "DELETE" }),
  merge: (items: CartItemInput[]) =>
    apiFetch<CartSnapshot>("/cart/merge", { method: "POST", body: JSON.stringify({ items }) }),
  /** Público: valida ítems de invitado sin persistir. */
  validate: (items: CartItemInput[]) =>
    apiFetch<CartSnapshot>("/cart/validate", { method: "POST", body: JSON.stringify({ items }) }),
};

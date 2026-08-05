"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";
import { getStoredToken } from "@/lib/auth/store";
import { cartApi, type CartItemInput, type CartSnapshot } from "@/lib/api/cart";
import { trackAddToCart } from "@/lib/analytics/meta-pixel";

type AddPayload = Omit<CartItem, "quantity" | "key"> & { quantity?: number };

type CartState = {
  items: CartItem[];
  /** Controla la apertura del drawer del carrito. */
  isOpen: boolean;
  hydrated: boolean;
  /** Avisos de validación del backend (precio/stock/disponibilidad). */
  issues: string[];
  hasBlockingIssues: boolean;
  syncing: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (payload: AddPayload) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  expireReservations: () => Promise<void>;
  // ── Sincronización con el backend ──
  applySnapshot: (snap: CartSnapshot) => void;
  hydrateFromServer: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  revalidate: () => Promise<void>;
  resetLocal: () => void;
};

function makeKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

/** Una reserva sólo cuenta si su vencimiento está en el futuro. */
function activeReservation(reservedUntil?: string | null): string | null {
  if (!reservedUntil) return null;
  return new Date(reservedUntil).getTime() > Date.now() ? reservedUntil : null;
}

function loggedIn() {
  return !!getStoredToken();
}

/** Mapea los ítems del backend al shape local del carrito. */
function fromSnapshot(snap: CartSnapshot): CartItem[] {
  return snap.items.map((it) => ({
    key: makeKey(it.productId, it.variantId ?? undefined),
    serverId: it.id,
    productId: it.productId,
    slug: it.slug ?? it.productId,
    name: it.name,
    image: it.image ?? "",
    price: it.price,
    previousPrice: it.previousPrice,
    quantity: it.quantity,
    variantId: it.variantId ?? undefined,
    variantLabel: it.variantLabel ?? undefined,
    maxStock: it.maxStock,
    availableStock: it.availableStock,
    status: it.status,
    reservedUntil: activeReservation(it.reservedUntil),
  }));
}

/** Ítems locales → payload que entiende el backend. */
function toInputs(items: CartItem[]): CartItemInput[] {
  return items.map((it) => ({
    product_id: Number(it.productId),
    product_variant_id: it.variantId ? Number(it.variantId) : null,
    quantity: it.quantity,
    price: it.price,
  }));
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      issues: [],
      hasBlockingIssues: false,
      syncing: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (payload) => {
        // Actualización optimista (UI inmediata). El backend resuelve el
        // carrito propio (logueado o invitado) y aplica la reserva real.
        set((state) => {
          const key = makeKey(payload.productId, payload.variantId);
          const qty = payload.quantity ?? 1;
          const existing = state.items.find((it) => it.key === key);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((it) =>
              it.key === key
                ? { ...it, quantity: Math.min(it.maxStock, it.quantity + qty) }
                : it,
            );
          } else {
            items = [
              ...state.items,
              { ...payload, key, quantity: Math.min(payload.maxStock, qty) },
            ];
          }
          return { items, isOpen: true };
        });

        trackAddToCart({
          id: payload.productId,
          name: payload.name,
          price: payload.price,
          quantity: payload.quantity ?? 1,
        });

        cartApi
          .add({
            product_id: Number(payload.productId),
            product_variant_id: payload.variantId ? Number(payload.variantId) : null,
            quantity: payload.quantity ?? 1,
          })
          .then((snap) => get().applySnapshot(snap))
          .catch(() => {});
      },

      removeItem: (key) => {
        const item = get().items.find((it) => it.key === key);
        set((state) => ({ items: state.items.filter((it) => it.key !== key) }));
        if (item?.serverId) {
          cartApi.remove(item.serverId).then((s) => get().applySnapshot(s)).catch(() => {});
        }
      },

      setQuantity: (key, quantity) => {
        const item = get().items.find((it) => it.key === key);
        set((state) => ({
          items: state.items
            .map((it) =>
              it.key === key
                ? { ...it, quantity: Math.max(0, Math.min(it.maxStock, quantity)) }
                : it,
            )
            .filter((it) => it.quantity > 0),
        }));
        if (item?.serverId) {
          cartApi
            .setQty(item.serverId, Math.max(0, quantity))
            .then((s) => get().applySnapshot(s))
            .catch(() => {});
        }
      },

      clear: () => {
        set({ items: [], issues: [], hasBlockingIssues: false });
        cartApi.clear().then((s) => get().applySnapshot(s)).catch(() => {});
      },

      expireReservations: async () => {
        // Quita la marca de reserva localmente — el backend ya liberó el stock
        // al vencerse reserved_until. Revalida para sincronizar el estado real.
        set((state) => ({
          items: state.items.map((it) => ({ ...it, reservedUntil: null })),
        }));
        await get().revalidate();
      },

      applySnapshot: (snap) =>
        set({
          items: fromSnapshot(snap),
          issues: snap.issues ?? [],
          hasBlockingIssues: !!snap.hasBlockingIssues,
        }),

      hydrateFromServer: async () => {
        if (!loggedIn()) return;
        set({ syncing: true });
        try {
          const snap = await cartApi.get();
          get().applySnapshot(snap);
        } catch {
          /* sin conexión: se mantiene el cache local */
        } finally {
          set({ syncing: false });
        }
      },

      mergeGuestCart: async () => {
        if (!loggedIn()) return;
        set({ syncing: true });
        try {
          const guest = toInputs(get().items);
          const snap = await cartApi.merge(guest);
          get().applySnapshot(snap);
        } catch {
          /* si falla la fusión, al menos cargamos el del servidor */
          try {
            get().applySnapshot(await cartApi.get());
          } catch {
            /* noop */
          }
        } finally {
          set({ syncing: false });
        }
      },

      revalidate: async () => {
        if (get().items.length === 0) {
          set({ issues: [], hasBlockingIssues: false });
          return;
        }
        set({ syncing: true });
        try {
          // El backend resuelve el carrito propio (Bearer token o
          // X-Guest-Cart-Token) — ya no hace falta distinguir logueado/invitado acá.
          get().applySnapshot(await cartApi.get());
        } catch {
          /* noop */
        } finally {
          set({ syncing: false });
        }
      },

      resetLocal: () => set({ items: [], issues: [], hasBlockingIssues: false }),
    }),
    {
      name: "petty-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

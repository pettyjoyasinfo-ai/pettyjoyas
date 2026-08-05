"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/store";
import { useCart } from "@/lib/cart/store";
import { isApiConfigured } from "@/lib/api/client";

/**
 * Mantiene el carrito en sintonía con la sesión:
 *  - Al iniciar sesión: fusiona el carrito de invitado con el del usuario (backend).
 *  - Si ya estaba logueado (recarga): carga el carrito del backend.
 *  - Como invitado: revalida los ítems contra el catálogo vivo.
 *  - Al cerrar sesión: limpia el carrito local (el del backend queda en el servidor).
 */
export function CartSync() {
  const user = useAuth((s) => s.user);
  const authHydrated = useAuth((s) => s.hydrated);
  const cartHydrated = useCart((s) => s.hydrated);

  const prevUserId = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (!isApiConfigured() || !authHydrated || !cartHydrated) return;

    const { mergeGuestCart, hydrateFromServer, revalidate, resetLocal } = useCart.getState();
    const id = user?.id ?? null;

    if (prevUserId.current === undefined) {
      // Primer pase tras hidratar: estado inicial.
      if (id) hydrateFromServer();
      else revalidate();
    } else if (prevUserId.current === null && id) {
      // Acaba de iniciar sesión → fusiona el carrito de invitado.
      mergeGuestCart();
    } else if (prevUserId.current && !id) {
      // Acaba de cerrar sesión → limpia el carrito local.
      resetLocal();
    }

    prevUserId.current = id;
  }, [user, authHydrated, cartHydrated]);

  return null;
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  /** NULL para admin (ve todo el panel). Para vendedor, módulos habilitados. */
  permissions?: string[] | null;
  /** true = tiene una contraseña provisoria, debe cambiarla antes de usar el panel. */
  mustChangePassword?: boolean;
  phone?: string | null;
  birthday?: string | null;
  avatar?: string | null;
  isStaff: boolean;
};

/** Token de clientes (tienda). */
const TOKEN_KEY = "petty-token";
/** Token de staff (panel admin). Separado para que admin y cliente no se pisen. */
export const ADMIN_TOKEN_KEY = "petty-admin-token";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
};

/** Store del cliente (tienda pública). Solo escribe/lee `petty-token`. */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null });
      },
    }),
    {
      name: "petty-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          if (state.token && typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, state.token);
          }
        }
      },
    },
  ),
);

/** Store del staff (panel admin). Solo escribe/lee `petty-admin-token`. */
export const useAdminAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== "undefined") localStorage.setItem(ADMIN_TOKEN_KEY, token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
        set({ user: null, token: null });
      },
    }),
    {
      name: "petty-admin-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          if (state.token && typeof window !== "undefined") {
            localStorage.setItem(ADMIN_TOKEN_KEY, state.token);
          }
        }
      },
    },
  ),
);

/** Lectura directa del token de cliente (para apiFetch fuera de React). */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Lectura directa del token de admin (para adminApiFetch fuera de React). */
export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

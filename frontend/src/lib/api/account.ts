"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/store";

export function useMyOrders() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["account", "orders"],
    queryFn: () => apiFetch<any[]>("/account/orders"),
    enabled: !!user,
  });
}

export function useMyOrder(id: string) {
  return useQuery({
    queryKey: ["account", "order", id],
    queryFn: () => apiFetch<any>(`/account/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const setUser = useAuth((s) => s.setUser);
  return useMutation({
    mutationFn: (body: any) => apiFetch<any>("/account/profile", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (user) => setUser(user),
  });
}

export function useActiveCoupons() {
  return useQuery({ queryKey: ["coupons", "active"], queryFn: () => apiFetch<any[]>("/coupons/active") });
}

// ─── Direcciones ──────────────────────────────────────────────────────────────

export type Address = {
  id: number;
  label: string;
  street: string;
  city: string;
  province: string | null;
  zip: string | null;
  is_default: boolean;
};

export function useMyAddresses() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["account", "addresses"],
    queryFn: () => apiFetch<Address[]>("/account/addresses"),
    enabled: !!user,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Address, "id">) =>
      apiFetch<Address>("/account/addresses", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account", "addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Omit<Address, "id">> }) =>
      apiFetch<Address>(`/account/addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account", "addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/account/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account", "addresses"] }),
  });
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

export function useFavorites() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["account", "favorites"],
    queryFn: () => apiFetch<any[]>("/account/favorites"),
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiFetch<{ favorited: boolean }>("/account/favorites/toggle", {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account", "favorites"] });
      qc.invalidateQueries({ queryKey: ["account", "favorite-ids"] });
    },
  });
}

export function useFavoriteIds() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["account", "favorite-ids"],
    queryFn: () => apiFetch<string[]>("/account/favorites/ids"),
    enabled: !!user,
  });
}

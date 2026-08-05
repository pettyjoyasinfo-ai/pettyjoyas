"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/store";
import type { Review } from "@/lib/types";

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => apiFetch<Review[]>(`/products/${productId}/reviews`),
    enabled: isApiConfigured() && !!productId,
  });
}

export function useCanReview(productId: string) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["can-review", productId],
    queryFn: () =>
      apiFetch<{ can_review: boolean; reason: string | null }>(
        `/products/${productId}/can-review`,
      ),
    enabled: isApiConfigured() && !!user && !!productId,
  });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; body: string }) =>
      apiFetch<Review>(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["can-review", productId] });
    },
  });
}

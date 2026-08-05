"use client";

import { useState } from "react";
import Link from "next/link";
import { PackageCheck, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { useProductReviews, useCreateReview, useCanReview } from "@/lib/api/reviews";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-gray-300",
          )}
        />
      ))}
    </div>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hover || value) >= n
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-gray-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initial = review.author.charAt(0).toUpperCase();
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-bg text-sm font-semibold text-ink">
        {initial}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{review.author}</span>
          <StarDisplay rating={review.rating} />
          <span className="text-xs text-muted">{review.createdAt}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-body">{review.body}</p>
      </div>
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const user = useAuth((s) => s.user);
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: canReviewData } = useCanReview(productId);
  const createReview = useCreateReview(productId);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isApiConfigured()) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || body.trim().length < 10) return;
    createReview.mutate(
      { rating, body: body.trim() },
      {
        onSuccess: () => {
          setRating(0);
          setBody("");
          setSuccess(true);
          setTimeout(() => setSuccess(false), 5000);
        },
      },
    );
  }

  const canSubmit = rating > 0 && body.trim().length >= 10;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="font-display text-2xl text-ink">
        Opiniones
        {reviews.length > 0 && (
          <span className="ml-2 text-base font-normal text-muted">
            ({reviews.length})
          </span>
        )}
      </h2>

      <div className="mt-6">
        {!user ? (
          <div className="rounded-2xl bg-stone-bg p-6 text-sm text-body">
            <Link href="/cuenta" className="font-medium text-brand hover:underline">
              Ingresá
            </Link>{" "}
            para dejar tu opinión sobre este producto.
          </div>
        ) : canReviewData?.reason === "not_purchased" ? (
          <div className="flex items-start gap-3 rounded-2xl bg-stone-bg p-6 text-sm text-body">
            <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <p>
              Solo pueden opinar quienes compraron este producto y ya lo recibieron.{" "}
              <Link href="/tienda" className="font-medium text-brand hover:underline">
                Ir a la tienda
              </Link>
            </p>
          </div>
        ) : canReviewData?.reason === "already_reviewed" ? (
          <div className="rounded-2xl bg-stone-bg p-6 text-sm text-body">
            ✓ Ya dejaste tu opinión sobre este producto. ¡Gracias!
          </div>
        ) : canReviewData?.can_review ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-line p-6"
          >
            <p className="text-sm font-medium text-ink">Dejá tu opinión</p>

            <div className="space-y-1.5">
              <span className="text-xs text-muted">Puntuación *</span>
              <StarInput value={rating} onChange={setRating} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-body" className="text-xs text-muted">
                Comentario *
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Contanos tu experiencia con este producto (mín. 10 caracteres)"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {createReview.isError && (
              <p className="text-sm text-brand">
                {((createReview.error as ApiError)?.details as any)?.message ??
                  "Hubo un error al enviar tu reseña. Intentá de nuevo."}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-700">
                ✓ ¡Gracias por tu opinión! Ya se publicó.
              </p>
            )}

            <button
              type="submit"
              disabled={createReview.isPending || !canSubmit}
              className="btn-brand text-sm"
            >
              {createReview.isPending ? "Enviando…" : "Publicar reseña"}
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-8 space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted">Cargando opiniones…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no hay opiniones para este producto. ¡Sé el primero!
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </section>
  );
}

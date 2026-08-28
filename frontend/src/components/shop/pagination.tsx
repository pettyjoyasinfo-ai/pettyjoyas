import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Paginación de /tienda. Server component: son todos <Link> que preservan
 * los filtros/orden actuales y solo cambian "pagina" — funciona sin JS y es
 * indexable/compartible por URL.
 */
export function ShopPagination({
  currentParams,
  page,
  totalPages,
}: {
  /** searchParams actuales de /tienda, ya resueltos a string. */
  currentParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(currentParams)) {
      if (v) params.set(k, v);
    }
    if (p <= 1) params.delete("pagina");
    else params.set("pagina", String(p));
    const qs = params.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  }

  // Rango compacto de números: actual ± 2, siempre con 1 y el último visibles.
  const pages = new Set<number>([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: (number | "…")[] = [];
  let prev = 0;
  for (const p of list) {
    if (prev && p - prev > 1) items.push("…");
    items.push(p);
    prev = p;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Paginación">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:border-brand",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-sm text-muted">…</span>
        ) : (
          <Link
            key={it}
            href={hrefFor(it)}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full text-sm transition",
              it === page ? "bg-brand text-white" : "text-ink hover:bg-stone-bg",
            )}
          >
            {it}
          </Link>
        ),
      )}

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:border-brand",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}

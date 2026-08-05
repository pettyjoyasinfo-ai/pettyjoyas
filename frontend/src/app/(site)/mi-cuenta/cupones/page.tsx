"use client";

import { useState } from "react";
import { Check, Copy, Tag } from "lucide-react";
import { useActiveCoupons } from "@/lib/api/account";
import { LoadingScreen } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";

export default function CuponesPage() {
  const { data: coupons = [], isLoading } = useActiveCoupons();
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback silent */
    }
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Mis cupones</h1>
      <p className="mt-1 text-sm text-body">Descuentos disponibles. Aplicalos en el carrito antes de pagar.</p>

      {coupons.length === 0 ? (
        <p className="mt-7 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">No hay cupones activos por ahora.</p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {coupons.map((c: any) => (
            <div key={c.code} className="relative overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-gold-700 shadow-sm"><Tag className="h-4 w-4" /></span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                  {c.type === "percent" ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`}
                </span>
              </div>
              <p className="mt-4 font-mono text-lg font-bold tracking-wide text-ink">{c.code}</p>
              <p className="mt-1 text-sm text-body">{c.description ?? "Descuento exclusivo"}</p>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-gold-200 pt-3">
                <span className="text-xs text-muted">{c.expiresAt ? `Vence ${c.expiresAt}` : "Sin vencimiento"}{c.minSubtotal ? ` · mín. ${formatPrice(c.minSubtotal)}` : ""}</span>
                <button
                  onClick={() => copyCode(c.code)}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  {copied === c.code ? (
                    <><Check className="h-3.5 w-3.5 text-green-600" /> <span className="text-green-600">Copiado</span></>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copiar</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

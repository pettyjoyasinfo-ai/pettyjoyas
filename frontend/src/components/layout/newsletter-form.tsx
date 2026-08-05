"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/newsletter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Error al suscribirte.");
      }
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al suscribirte.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
        <Check className="h-4 w-4 text-gold" /> ¡Gracias! Te avisaremos de novedades.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex overflow-hidden rounded-full bg-white/10 p-1">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email"
          className="flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Suscribirme"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink transition hover:bg-white disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

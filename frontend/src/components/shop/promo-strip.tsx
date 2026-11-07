"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePublicSettings } from "@/lib/api/admin";
import type { PromoItem, PromoSettings } from "@/lib/data/settings";

const DISMISS_KEY = "petty-promo-cerrada";
const TZ = "America/Argentina/Buenos_Aires";

/** Fecha (AAAA-MM-DD) y día de la semana (0=domingo) en Argentina, sin importar el reloj del celular. */
function argentinaToday(): { date: string; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday };
}

/** ¿El flyer corre hoy? Respeta encendido, días de la semana y rango de fechas. */
export function isPromoActive(item: PromoItem, today = argentinaToday()): boolean {
  if (!item.enabled || !item.title?.trim()) return false;
  if (item.days?.length && !item.days.includes(today.weekday)) return false;
  if (item.from && today.date < item.from) return false;
  if (item.to && today.date > item.to) return false;
  return true;
}

export function PromoCard({ item, onClose }: { item: PromoItem; onClose?: () => void }) {
  const style = { backgroundColor: item.bg || "#821f40", color: item.fg || "#ffffff" };
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      {item.image && (
        <span className="relative hidden h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:block">
          <Image src={item.image} alt="" fill sizes="36px" className="object-cover" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{item.title}</span>
        {item.text && <span className="block truncate text-xs opacity-85">{item.text}</span>}
      </span>
    </span>
  );

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5" style={style}>
      {item.href ? (
        <Link href={item.href} prefetch={false} className="min-w-0 flex-1 hover:opacity-90">{body}</Link>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar promoción" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Franja de promociones arriba del listado de productos. Se edita en el panel
 * (Apariencia → Flyers promocionales). Si hay varias vigentes hoy, rota entre ellas.
 * Una sola línea y con botón para cerrarla (queda cerrada en esa visita).
 */
export function PromoStrip() {
  const { data } = usePublicSettings();
  const promo = data?.promo as PromoSettings | undefined;
  const [mounted, setMounted] = useState(false);
  const [closed, setClosed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    try { setClosed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { /* sin storage */ }
  }, []);

  // La vigencia depende del día: se calcula recién en el navegador (evita diferencias con el HTML del servidor).
  const items = mounted && promo?.enabled ? (promo.items ?? []).filter((i) => isPromoActive(i)) : [];

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (closed || items.length === 0) return null;
  const item = items[index % items.length];

  function close() {
    setClosed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* sin storage */ }
  }

  return (
    <div className="mb-5" aria-live="polite">
      <PromoCard item={item} onClose={close} />
      {items.length > 1 && (
        <div className="mt-1.5 flex justify-center gap-1.5">
          {items.map((it, i) => (
            <button
              key={it.id || i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver promoción ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index % items.length ? "w-4 bg-ink" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

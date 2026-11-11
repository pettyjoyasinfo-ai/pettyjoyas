"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Percent, X } from "lucide-react";
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

/** Link interno (/tienda…) con Link de Next; uno externo (https://, wa.me) se abre en otra pestaña. */
function PromoLink({ href, className, style, children }: {
  href: string; className: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{children}</a>;
  }
  return <Link href={href} prefetch={false} className={className} style={style}>{children}</Link>;
}

export function PromoCard({ item, onClose }: { item: PromoItem; onClose?: () => void }) {
  const style = { backgroundColor: item.bg || "#821f40", color: item.fg || "#ffffff" };
  const href = item.href?.trim() || "";
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
      {href ? (
        <PromoLink href={href} className="min-w-0 flex-1 hover:opacity-90">{body}</PromoLink>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
      {/* El botón solo aparece si la promo tiene a dónde llevar. Colores invertidos para que se distinga. */}
      {href && (
        <PromoLink
          href={href}
          className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-90"
          style={{ backgroundColor: item.fg || "#ffffff", color: item.bg || "#821f40" }}
        >
          {item.cta?.trim() || "Ver más"}
        </PromoLink>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Minimizar promoción" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Flyer flotante: una barra chica fija abajo que acompaña al cliente mientras navega la tienda.
 * Aparece de a poco (al bajar un poco o a los pocos segundos) y rota entre las promos vigentes
 * de hoy. Con la ✕ se achica a una burbuja abajo a la izquierda (queda así en esa visita) y al
 * tocarla se vuelve a abrir. Se edita en el panel (Apariencia → Flyers promocionales).
 * Deja libre la esquina de WhatsApp y el chat.
 */
export function PromoFloating() {
  const pathname = usePathname();
  const { data } = usePublicSettings();
  const promo = data?.promo as PromoSettings | undefined;
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [shown, setShown] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    try { setMinimized(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { /* sin storage */ }
    // "Que vaya apareciendo": entra con un deslizamiento al bajar un poco o a los 4 segundos.
    const reveal = () => setShown(true);
    const onScroll = () => { if (window.scrollY > 250) reveal(); };
    const t = setTimeout(reveal, 4000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  // La vigencia depende del día: se calcula recién en el navegador (evita diferencias con el HTML del servidor).
  const items = mounted && promo?.enabled ? (promo.items ?? []).filter((i) => isPromoActive(i)) : [];

  useEffect(() => {
    if (items.length < 2 || minimized) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length, minimized]);

  // En carrito y checkout no distrae ni tapa el botón de pagar.
  const hiddenHere = pathname?.startsWith("/checkout") || pathname?.startsWith("/carrito");
  if (hiddenHere || items.length === 0) return null;
  const item = items[index % items.length];

  function setMin(value: boolean) {
    setMinimized(value);
    try {
      if (value) sessionStorage.setItem(DISMISS_KEY, "1");
      else sessionStorage.removeItem(DISMISS_KEY);
    } catch { /* sin storage */ }
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMin(false)}
        aria-label={`Ver promoción: ${item.title}`}
        title={item.title}
        className={`fixed bottom-5 left-4 z-30 grid h-12 w-12 place-items-center overflow-hidden rounded-full shadow-lg ring-2 ring-white transition-all duration-500 hover:scale-105 ${
          shown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: item.bg || "#821f40", color: item.fg || "#ffffff" }}
      >
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <Percent className="h-5 w-5" />
        )}
        {items.length > 1 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold text-ink shadow">
            {items.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-4 left-3 right-[5.5rem] z-30 transition-all duration-700 ease-out md:left-1/2 md:right-auto md:w-[min(600px,calc(100%-14rem))] md:-translate-x-1/2 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div key={item.id || index} className="rounded-xl opacity-95 shadow-lg">
        <PromoCard item={item} onClose={() => setMin(true)} />
      </div>
    </div>
  );
}

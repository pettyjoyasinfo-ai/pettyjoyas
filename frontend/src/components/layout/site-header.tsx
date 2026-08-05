"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { useAuth } from "@/lib/auth/store";
import { useFavoriteIds } from "@/lib/api/account";
import { useCategories } from "@/lib/api/queries";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import type { Category } from "@/lib/types";

type NavLink = { label: string; href: string };

const STATIC_NAV_LEFT: NavLink[] = [{ label: "Inicio", href: "/" }];
const STATIC_NAV_RIGHT: NavLink[] = [
  { label: "Ofertas", href: "/tienda?oferta=1" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

function buildTree(cats: Category[]): { root: Category; children: Category[] }[] {
  const roots = cats.filter((c) => !c.parentSlug);
  const byParent: Record<string, Category[]> = {};
  for (const c of cats) {
    if (c.parentSlug) {
      byParent[c.parentSlug] ??= [];
      byParent[c.parentSlug].push(c);
    }
  }
  return roots.map((r) => ({ root: r, children: byParent[r.slug] ?? [] }));
}

/** Dropdown de Tienda con categorías dinámicas y subcategorías agrupadas */
function TiendaDropdown({
  transparent,
  tree,
}: {
  transparent: boolean;
  tree: { root: Category; children: Category[] }[];
}) {
  return (
    <div className="group relative">
      <Link
        href="/tienda"
        className={cn(
          "flex items-center gap-1 py-2 text-sm font-medium transition",
          transparent ? "text-white hover:text-white/75" : "text-ink hover:text-brand",
        )}
      >
        Tienda
        <ChevronDown className="h-3.5 w-3.5" />
      </Link>

      <div className="invisible absolute left-1/2 top-full w-64 -translate-x-1/2 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
        {tree.map(({ root, children }) =>
          children.length > 0 ? (
            <div key={root.slug}>
              <Link
                href={`/tienda?categoria=${root.slug}`}
                className="block rounded-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:bg-stone-bg hover:text-brand"
              >
                {root.name}
              </Link>
              {children.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/tienda?categoria=${sub.slug}`}
                  className="block rounded-xl py-1.5 pl-8 pr-4 text-sm text-body transition hover:bg-stone-bg hover:text-brand"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={root.slug}
              href={`/tienda?categoria=${root.slug}`}
              className="block rounded-xl px-4 py-2.5 text-sm text-body transition hover:bg-stone-bg hover:text-brand"
            >
              {root.name}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCart((s) => s.items.reduce((n, it) => n + it.quantity, 0));
  const hydrated = useCart((s) => s.hydrated);
  const openCart = useCart((s) => s.open);
  const authUser = useAuth((s) => s.user);
  const accountHref = authUser ? "/mi-cuenta" : "/cuenta";
  const { data: favIds = [] } = useFavoriteIds();
  const favCount = favIds.length;
  const { data: rawCategories = [] } = useCategories();

  const tree = buildTree(rawCategories);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !searchOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/tienda?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
  }

  const iconBtn = cn(
    "grid h-10 w-10 place-items-center rounded-full transition",
    transparent
      ? "text-white hover:bg-white/15"
      : "text-ink hover:bg-stone-bg hover:text-brand",
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        isHome && "-mb-20",
        transparent
          ? "border-b border-white/15 bg-transparent"
          : scrolled
            ? "bg-white shadow-[0_4px_24px_rgba(1,15,28,0.06)]"
            : "border-b border-line bg-white",
      )}
    >
      <div className="container-px flex h-20 items-center justify-between gap-2 sm:gap-4">
        {/* Mobile: menú (flex-1 para centrar el logo) */}
        <div className="flex flex-1 items-center lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu className={cn("h-6 w-6", transparent ? "text-white" : "text-ink")} />
          </button>
        </div>

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Logo variant={transparent ? "light" : "dark"} />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 lg:flex">
          {STATIC_NAV_LEFT.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "py-2 text-sm font-medium transition",
                transparent ? "text-white hover:text-white/75" : "text-ink hover:text-brand",
              )}
            >
              {link.label}
            </Link>
          ))}

          <TiendaDropdown transparent={transparent} tree={tree} />

          {STATIC_NAV_RIGHT.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "py-2 text-sm font-medium transition",
                transparent ? "text-white hover:text-white/75" : "text-ink hover:text-brand",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2 lg:flex-none">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
            className={iconBtn}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link href={accountHref} aria-label="Mi cuenta" className={cn(iconBtn, "hidden sm:grid")}>
            <User className="h-5 w-5" />
          </Link>
          <Link href="/favoritos" aria-label="Favoritos" className={cn(iconBtn, "relative hidden sm:grid")}>
            <Heart className="h-5 w-5" />
            {authUser && favCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito"
            className={cn(iconBtn, "relative")}
          >
            <ShoppingBag className="h-5 w-5" />
            {hydrated && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Overlay de búsqueda */}
      {searchOpen && (
        <div className="border-t border-line bg-white">
          <form onSubmit={submitSearch} className="container-px flex h-16 items-center gap-3">
            <Search className="h-5 w-5 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar anillos, collares, aros…"
              className="h-full flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
              className="text-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={rawCategories} />
    </header>
  );
}

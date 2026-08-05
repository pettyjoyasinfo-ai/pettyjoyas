"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, Heart, User, X } from "lucide-react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import type { Category } from "@/lib/types";

const STATIC_LINKS = [
  { label: "Inicio", href: "/" },
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

export function MobileMenu({
  open,
  onClose,
  categories = [],
}: {
  open: boolean;
  onClose: () => void;
  categories?: Category[];
}) {
  const [tiendaOpen, setTiendaOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const tree = buildTree(categories);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo className="text-xl" />
          <button onClick={onClose} aria-label="Cerrar menú">
            <X className="h-6 w-6 text-ink" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {/* Inicio */}
          <div className="border-b border-line/60">
            <Link
              href="/"
              onClick={onClose}
              className="block px-3 py-3.5 text-[15px] font-medium text-ink hover:text-brand"
            >
              Inicio
            </Link>
          </div>

          {/* Tienda con subcategorías */}
          <div className="border-b border-line/60">
            <button
              type="button"
              onClick={() => setTiendaOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-3.5 text-left text-[15px] font-medium text-ink"
            >
              Tienda
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", tiendaOpen && "rotate-180")}
              />
            </button>
            {tiendaOpen && (
              <div className="pb-2">
                {/* Enlace a toda la tienda */}
                <Link
                  href="/tienda"
                  onClick={onClose}
                  className="block rounded-lg px-6 py-2.5 text-sm text-body hover:text-brand"
                >
                  Todas las joyas
                </Link>

                {tree.map(({ root, children }) =>
                  children.length > 0 ? (
                    <div key={root.slug}>
                      <div className="flex items-center">
                        <Link
                          href={`/tienda?categoria=${root.slug}`}
                          onClick={onClose}
                          className="flex-1 rounded-lg px-6 py-2 text-sm font-medium text-body hover:text-brand"
                        >
                          {root.name}
                        </Link>
                        <button
                          onClick={() =>
                            setExpandedParent((p) => (p === root.slug ? null : root.slug))
                          }
                          className="grid h-8 w-8 shrink-0 place-items-center text-muted hover:text-ink"
                        >
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              expandedParent === root.slug && "rotate-90",
                            )}
                          />
                        </button>
                      </div>
                      {expandedParent === root.slug && (
                        <div className="ml-4 border-l border-line pl-2">
                          {children.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/tienda?categoria=${sub.slug}`}
                              onClick={onClose}
                              className="block rounded-lg px-4 py-2 text-sm text-body hover:text-brand"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={root.slug}
                      href={`/tienda?categoria=${root.slug}`}
                      onClick={onClose}
                      className="block rounded-lg px-6 py-2.5 text-sm text-body hover:text-brand"
                    >
                      {root.name}
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Resto del nav */}
          {STATIC_LINKS.slice(1).map((link) => (
            <div key={link.href} className="border-b border-line/60">
              <Link
                href={link.href}
                onClick={onClose}
                className="block px-3 py-3.5 text-[15px] font-medium text-ink hover:text-brand"
              >
                {link.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <div className="flex gap-3">
            <Link
              href="/cuenta"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium text-ink"
            >
              <User className="h-4 w-4" /> Cuenta
            </Link>
            <Link
              href="/favoritos"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium text-ink"
            >
              <Heart className="h-4 w-4" /> Favoritos
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted">{SITE.schedule}</p>
        </div>
      </aside>
    </>
  );
}

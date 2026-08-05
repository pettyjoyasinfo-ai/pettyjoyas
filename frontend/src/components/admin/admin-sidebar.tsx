"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  Gem,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  Percent,
  QrCode,
  Rss,
  Settings,
  ShoppingCart,
  Store,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessModule, type ModuleKey } from "@/lib/admin/modules";
import { useAdminAuth } from "@/lib/auth/store";

const GROUPS: { title: string; links: { href: string; label: string; icon: React.ElementType; module?: ModuleKey }[] }[] = [
  {
    title: "General",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, module: "pedidos" },
      { href: "/admin/pos", label: "Venta presencial", icon: Store, module: "pos" },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { href: "/admin/productos", label: "Productos", icon: Gem, module: "productos" },
      { href: "/admin/categorias", label: "Categorías", icon: FolderTree, module: "categorias" },
      { href: "/admin/etiquetas", label: "Etiquetas y códigos", icon: QrCode, module: "etiquetas" },
      { href: "/admin/banners", label: "Apariencia", icon: Images, module: "banners" },
    ],
  },
  {
    title: "Clientes y marketing",
    links: [
      { href: "/admin/clientes", label: "Clientes (CRM)", icon: Users, module: "clientes" },
      { href: "/admin/marketing", label: "Cupones", icon: Megaphone, module: "marketing" },
      { href: "/admin/descuentos", label: "Descuentos", icon: Percent, module: "descuentos" },
      { href: "/admin/newsletter", label: "Newsletter", icon: Rss, module: "newsletter" },
      { href: "/admin/emails", label: "Emails automáticos", icon: Mail, module: "emails" },
      { href: "/admin/chatbot", label: "WhatsApp", icon: MessageCircle, module: "chatbot" },
    ],
  },
  {
    title: "Sistema",
    links: [
      { href: "/admin/reportes",      label: "Reportes",      icon: BarChart3, module: "reportes" },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings,  module: "configuracion" },
      { href: "/admin/perfil",        label: "Mi perfil",     icon: User },
    ],
  },
];

/** Contenido del sidebar (compartido entre desktop fijo y drawer mobile). */
function SidebarContent({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout?: () => void }) {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  return (
    <>
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/assets/img/logo/petty-mark.png"
          alt="Petty Joyas"
          width={30}
          height={46}
          className="h-9 w-auto"
        />
        <span className="flex flex-col leading-none text-white">
          <span className="text-sm font-medium tracking-[0.18em]">PETTY</span>
          <span className="mt-0.5 text-[9px] tracking-[0.4em] text-white/60">ADMIN</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group) => {
          const visibleLinks = group.links.filter(
            (l) => !l.module || canAccessModule(user, l.module),
          );
          if (visibleLinks.length === 0) return null;
          return (
          <div key={group.title} className="mt-4">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {group.title}
            </p>
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition",
                    active
                      ? "bg-white/10 font-medium text-gold-300"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-white/65 transition hover:bg-white/5 hover:text-white"
        >
          <Store className="h-4 w-4" /> Ver la tienda
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] text-white/65 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function AdminSidebar({
  mobileOpen,
  onClose,
  onLogout,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}) {
  return (
    <>
      {/* Desktop: sidebar fijo */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink lg:flex">
        <SidebarContent onLogout={onLogout} />
      </aside>

      {/* Mobile: overlay + drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82%] flex-col bg-ink transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} onLogout={onLogout} />
      </aside>
    </>
  );
}

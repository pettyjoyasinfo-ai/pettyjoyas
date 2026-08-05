"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Tag,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/store";
import { apiLogout } from "@/lib/api/auth";

const LINKS = [
  { href: "/mi-cuenta", label: "Resumen", icon: LayoutDashboard },
  { href: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: Package },
  { href: "/mi-cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/mi-cuenta/cupones", label: "Mis cupones", icon: Tag },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/mi-cuenta/datos", label: "Mis datos", icon: UserRound },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuth();

  async function logout() {
    await apiLogout();
    clear();
    router.replace("/cuenta");
  }

  const initials = (user?.name ?? "Cliente").split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <aside className="h-fit rounded-2xl border border-line lg:sticky lg:top-28">
      <div className="flex items-center gap-3 border-b border-line p-5">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-khaki-100 font-display text-lg text-gold-700">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{user?.name ?? "Mi cuenta"}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
      </div>

      <nav className="flex flex-col p-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/mi-cuenta" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition",
                active
                  ? "bg-brand-50 font-semibold text-brand-700"
                  : "text-body hover:bg-stone-bg hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="mt-1 flex items-center gap-3 rounded-xl border-t border-line px-4 py-2.5 pt-3.5 text-left text-sm text-muted transition hover:text-brand"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, LogOut, Menu, Package, Search, ShoppingCart, User, Users, X,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RouteProgress } from "@/components/ui/route-progress";
import { LoadingScreen } from "@/components/ui/spinner";
import { useAdminAuth } from "@/lib/auth/store";
import { apiAdminLogout } from "@/lib/api/auth";
import { canAccessModule, moduleForPath } from "@/lib/admin/modules";
import {
  useAdminMe,
  useAdminNotifications,
  useAdminSearch,
  type AdminNotifItem,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const NOTIF_ICON: Record<AdminNotifItem["type"], React.ElementType> = {
  pending_orders: ShoppingCart,
  low_stock:      Package,
  new_customers:  Users,
};

const NOTIF_COLOR: Record<AdminNotifItem["type"], string> = {
  pending_orders: "bg-amber-50 text-amber-600",
  low_stock:      "bg-red-50 text-red-600",
  new_customers:  "bg-green-50 text-green-700",
};

const DISMISSED_KEY = "petty-admin-notif-dismissed";

/** Guarda, por tipo, el `count` que ya viste al descartarlo — la campanita
 * lo vuelve a mostrar solo si el conteo real sube por encima de ese valor
 * (ej. descartaste "3 pedidos pendientes" y después entra un 4to). */
function readDismissed(): Partial<Record<AdminNotifItem["type"], number>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [debouncedQ,   setDebouncedQ]   = useState("");
  const [dismissed,    setDismissed]    = useState<Partial<Record<AdminNotifItem["type"], number>>>({});

  useEffect(() => { setDismissed(readDismissed()); }, []);

  function dismissNotif(item: AdminNotifItem) {
    setDismissed((prev) => {
      const next = { ...prev, [item.type]: item.count };
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  }

  const notifRef  = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrated, clear, setUser } = useAdminAuth();

  // Mantiene al día rol/permisos/estado contra el backend — la sesión
  // persistida en localStorage, si no, se queda con lo que había al loguearse
  // y un cambio de permisos del admin no se reflejaría hasta un logout manual.
  //
  // OJO: al cerrar sesión, este fetch puede seguir "en vuelo" (ya se había
  // disparado con el token viejo antes de que logout() lo borre) y resolver
  // recién después — sin el chequeo de `token` de acá abajo, ese resultado
  // tardío volvía a poner un `user` no nulo justo después de que clear() lo
  // dejara en null, y la sesión quedaba "resucitada" a medias (con user pero
  // sin token real), mostrando el panel como si nunca hubiese cerrado sesión.
  const { data: freshMe } = useAdminMe(hydrated && !!user);
  useEffect(() => {
    if (freshMe && token) setUser(freshMe);
  }, [freshMe, token, setUser]);

  // Debounce del buscador (300 ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Cierre de dropdowns al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchQuery("");
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Guard: solo staff
  useEffect(() => {
    if (hydrated && (!user || !user.isStaff)) {
      router.replace("/cuenta?next=/admin");
    }
  }, [hydrated, user, router]);

  // Guard: si un vendedor entra directo por URL a un módulo sin permiso
  // (no solo escondido del menú), lo mandamos de vuelta al dashboard.
  useEffect(() => {
    if (!hydrated || !user) return;
    const moduleKey = moduleForPath(pathname);
    if (moduleKey && !canAccessModule(user, moduleKey)) {
      router.replace("/admin");
    }
  }, [hydrated, user, pathname, router]);

  // Guard: contraseña provisoria (usuario recién creado) — no puede usar el
  // resto del panel hasta cambiarla en Mi perfil.
  useEffect(() => {
    if (hydrated && user?.mustChangePassword && pathname !== "/admin/perfil") {
      router.replace("/admin/perfil");
    }
  }, [hydrated, user, pathname, router]);

  const { data: notifData } = useAdminNotifications();
  const { data: searchData } = useAdminSearch(debouncedQ);

  // Un tipo descartado se oculta hasta que su conteo real supere lo que ya
  // viste (ej. viste "3 pedidos pendientes" y ahora hay 4 — reaparece).
  const visibleNotifs = (notifData?.items ?? []).filter(
    (item) => item.count > (dismissed[item.type] ?? 0),
  );
  const notifTotal = visibleNotifs.reduce((sum, item) => sum + item.count, 0);
  const hasResults =
    debouncedQ.length >= 2 &&
    searchData &&
    (searchData.products.length > 0 || searchData.orders.length > 0 || searchData.customers.length > 0);

  async function logout() {
    await apiAdminLogout();
    clear();
    router.replace("/cuenta");
  }

  if (!hydrated)               return <LoadingScreen label="Verificando acceso…" />;
  if (!user || !user.isStaff) return <LoadingScreen label="Redirigiendo…" />;

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="min-h-screen bg-stone-bg">
      <RouteProgress />
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={logout} />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-5">
          {/* Mobile: toggle del menú */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition hover:bg-stone-bg lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile: logo */}
          <Link href="/admin" className="flex items-center lg:hidden">
            <Image src="/assets/img/logo/petty-mark.png" alt="Petty Joyas" width={22} height={34} className="h-7 w-auto" />
          </Link>

          {/* Buscador */}
          <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
            <div className="flex items-center gap-2.5 rounded-full bg-stone-bg px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto, pedido o cliente…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Resultados */}
            {hasResults && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                {searchData!.products.length > 0 && (
                  <SearchGroup title="Productos"  items={searchData!.products}  onClose={() => setSearchQuery("")} />
                )}
                {searchData!.orders.length > 0 && (
                  <SearchGroup title="Pedidos"    items={searchData!.orders}    onClose={() => setSearchQuery("")} />
                )}
                {searchData!.customers.length > 0 && (
                  <SearchGroup title="Clientes"   items={searchData!.customers} onClose={() => setSearchQuery("")} />
                )}
              </div>
            )}
            {debouncedQ.length >= 2 && searchData && !hasResults && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-line bg-white px-4 py-6 text-center text-sm text-muted shadow-lg">
                Sin resultados para &ldquo;{debouncedQ}&rdquo;
              </div>
            )}
          </div>

          {/* Acciones derecha */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Campana de notificaciones */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-stone-bg"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {notifTotal > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
                    {notifTotal > 99 ? "99+" : notifTotal}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <h3 className="text-sm font-semibold text-ink">Notificaciones</h3>
                    <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-ink">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {visibleNotifs.length > 0 ? (
                    <ul className="py-1">
                      {visibleNotifs.map((item) => {
                        const Icon = NOTIF_ICON[item.type];
                        return (
                          <li key={item.type} className="group flex items-center gap-1 px-1.5">
                            <Link
                              href={item.href}
                              onClick={() => setNotifOpen(false)}
                              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 py-3 transition hover:bg-stone-bg"
                            >
                              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", NOTIF_COLOR[item.type])}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="truncate text-sm text-ink">{item.label}</span>
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); dismissNotif(item); }}
                              aria-label="Descartar notificación"
                              title="Descartar"
                              className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-stone-bg hover:text-ink"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-muted">Sin notificaciones nuevas</p>
                  )}
                </div>
              )}
            </div>

            {/* Avatar + menú de usuario */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-stone-bg"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-khaki-100 text-sm font-semibold text-gold-700">
                  {initials}
                </span>
                <div className="hidden leading-tight md:block">
                  <p className="text-sm font-medium text-ink">{user.name}</p>
                  <p className="text-[11px] text-muted capitalize">{user.role}</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                  <Link
                    href="/admin/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink transition hover:bg-stone-bg"
                  >
                    <User className="h-4 w-4 text-muted" />
                    Mi perfil
                  </Link>
                  <hr className="border-line" />
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-ink transition hover:bg-stone-bg"
                  >
                    <LogOut className="h-4 w-4 text-muted" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}

function SearchGroup({
  title,
  items,
  onClose,
}: {
  title: string;
  items: { id: number; label: string; sub: string; href: string }[];
  onClose: () => void;
}) {
  return (
    <div>
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={onClose}
          className="flex items-center justify-between px-4 py-2 transition hover:bg-stone-bg"
        >
          <span className="truncate text-sm text-ink">{item.label}</span>
          <span className="ml-3 shrink-0 text-xs text-muted">{item.sub}</span>
        </Link>
      ))}
    </div>
  );
}

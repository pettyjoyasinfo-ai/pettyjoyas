/**
 * Módulos del panel admin gateables por permiso de usuario. Dashboard y "Mi
 * perfil" quedan siempre visibles para cualquier staff — no están acá.
 */
export type ModuleKey =
  | "pedidos"
  | "pos"
  | "productos"
  | "categorias"
  | "etiquetas"
  | "banners"
  | "clientes"
  | "marketing"
  | "descuentos"
  | "newsletter"
  | "emails"
  | "chatbot"
  | "reportes"
  | "configuracion";

export const ADMIN_MODULES: { key: ModuleKey; label: string; href: string }[] = [
  { key: "pedidos", label: "Pedidos", href: "/admin/pedidos" },
  { key: "pos", label: "Venta presencial", href: "/admin/pos" },
  { key: "productos", label: "Productos", href: "/admin/productos" },
  { key: "categorias", label: "Categorías", href: "/admin/categorias" },
  { key: "etiquetas", label: "Etiquetas y códigos", href: "/admin/etiquetas" },
  { key: "banners", label: "Apariencia", href: "/admin/banners" },
  { key: "clientes", label: "Clientes (CRM)", href: "/admin/clientes" },
  { key: "marketing", label: "Cupones", href: "/admin/marketing" },
  { key: "descuentos", label: "Descuentos", href: "/admin/descuentos" },
  { key: "newsletter", label: "Newsletter", href: "/admin/newsletter" },
  { key: "emails", label: "Emails automáticos", href: "/admin/emails" },
  { key: "chatbot", label: "WhatsApp", href: "/admin/chatbot" },
  { key: "reportes", label: "Reportes", href: "/admin/reportes" },
  { key: "configuracion", label: "Configuración", href: "/admin/configuracion" },
];

type PermCheckUser = { role: string; permissions?: string[] | null } | null | undefined;

/** Admin siempre tiene acceso a todo; vendedor solo a lo que tenga en `permissions`. */
export function canAccessModule(user: PermCheckUser, moduleKey: ModuleKey): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions ?? []).includes(moduleKey);
}

/** Módulo (si existe) al que pertenece una ruta /admin/... dada. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const found = ADMIN_MODULES.find((m) => pathname.startsWith(m.href));
  return found?.key ?? null;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApiFetch as apiFetch } from "@/lib/api/client";

/**
 * Acceso a datos del PANEL ADMIN contra la API de Laravel (con token Sanctum,
 * inyectado automáticamente por apiFetch). React Query maneja cache y estados.
 */

// Las respuestas paginadas vienen como { data, meta }; las simples, como array.
function unwrap<T>(res: any): T {
  return (res && typeof res === "object" && "data" in res ? res.data : res) as T;
}

// ─────────── Sesión ───────────
/**
 * Refresca el usuario staff logueado contra el backend. `useAdminAuth` persiste
 * el usuario (rol, permisos) en localStorage desde el login y nunca se
 * actualizaba solo — si un admin le cambiaba los módulos habilitados a un
 * vendedor que ya tenía sesión abierta, esa sesión seguía viendo los permisos
 * viejos hasta un logout/login manual. Este hook lo mantiene al día.
 */
export function useAdminMe(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => apiFetch<any>("/auth/me"),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

// ─────────── Dashboard / Reportes ───────────
export function useDashboard(dias = 30) {
  return useQuery({
    queryKey: ["admin", "dashboard", dias],
    queryFn: () => apiFetch<any>(`/reports/dashboard?dias=${dias}`),
  });
}

export function useComparison(periodo: string, from?: string, to?: string) {
  const params = new URLSearchParams({ periodo });
  if (periodo === "custom" && from && to) {
    params.set("from", from);
    params.set("to", to);
  }
  return useQuery({
    queryKey: ["admin", "comparison", periodo, from, to],
    queryFn:  () => apiFetch<any>(`/reports/comparison?${params}`),
    enabled:  periodo !== "custom" || !!(from && to),
  });
}

export function usePaymentBreakdown(from?: string, to?: string) {
  const params = from && to
    ? new URLSearchParams({ from, to })
    : new URLSearchParams({ dias: "30" });
  return useQuery({
    queryKey: ["admin", "payment-breakdown", from, to],
    queryFn:  () => apiFetch<any>(`/reports/payment-breakdown?${params}`),
  });
}

export function useTopCustomers() {
  return useQuery({ queryKey: ["admin", "top-customers"], queryFn: () => apiFetch<any[]>(`/reports/top-customers`) });
}
export function useCouponReport() {
  return useQuery({ queryKey: ["admin", "coupon-report"], queryFn: () => apiFetch<any[]>(`/reports/coupons`) });
}

// ─────────── Productos ───────────
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/products?orden=nuevos`)),
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => apiFetch<any>(`/products/${id}`),
    enabled: !!id,
  });
}

/**
 * Guarda los dos datos manuales del módulo de Etiquetas (referencia + peso/
 * multiplicador) en el producto o en una variante puntual — se llama con
 * debounce mientras el usuario escribe, sin botón de guardar.
 */
export function useUpdateLabelInfo() {
  return useMutation({
    mutationFn: ({ productSlug, variantId, ref, weight }: {
      productSlug: string; variantId: string | null; ref: string; weight: string;
    }) =>
      apiFetch(`/products/${productSlug}/label-info`, {
        method: "PATCH",
        body: JSON.stringify({ variant_id: variantId, label_ref: ref, label_weight: weight }),
      }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/products`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

// ─────────── Pedidos ───────────
export function useAdminOrders(params = "") {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/orders${params}`)),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => apiFetch<any>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (updated: any, { id }) => {
      qc.setQueryData(["admin", "order", id], updated);
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useUpdateOrderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      apiFetch(`/orders/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
    onSuccess: (updated: any, { id }) => {
      qc.setQueryData(["admin", "order", id], updated);
    },
  });
}

/** Corrige medio de pago y/o monto de una venta presencial ya cargada (POS). */
export function useEditPosSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_method, total }: { id: string; payment_method?: string; total?: number }) =>
      apiFetch(`/pos/sales/${id}/edit`, { method: "PATCH", body: JSON.stringify({ payment_method, total }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["pos", "daily-summary"] });
    },
  });
}

export function useNotifyCustomer() {
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      apiFetch(`/orders/${id}/notify`, { method: "POST", body: JSON.stringify({ message }) }),
  });
}

export async function fetchOrdersExport(params: string): Promise<any[]> {
  const res = await apiFetch<any>(`/orders/export${params}`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

// ─────────── Clientes (CRM) ───────────
export async function fetchCustomersExport(params: string): Promise<any[]> {
  const res = await apiFetch<any>(`/customers/export${params}`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export function useSendCustomerEmail() {
  return useMutation({
    mutationFn: ({ id, subject, message }: { id: string; subject: string; message: string }) =>
      apiFetch(`/customers/${id}/email`, { method: "POST", body: JSON.stringify({ subject, message }) }),
  });
}

export function useAdminCustomers(params = "") {
  return useQuery({
    queryKey: ["admin", "customers", params],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/customers${params}`)),
  });
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => apiFetch<any>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/customers`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiFetch(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      qc.invalidateQueries({ queryKey: ["admin", "customer", v.id] });
    },
  });
}

// ─────────── Cupones ───────────
export function useAdminCoupons() {
  return useQuery({ queryKey: ["admin", "coupons"], queryFn: () => apiFetch<any[]>(`/coupons`) });
}
export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/coupons`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}
export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiFetch(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}
export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}
export function useSendCouponEmail() {
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      apiFetch(`/coupons/${id}/send`, { method: "POST", body: JSON.stringify({ email }) }),
  });
}

// ─────────── Emails ───────────
export function useEmailFlows() {
  return useQuery({ queryKey: ["admin", "emails"], queryFn: () => apiFetch<any[]>(`/emails`) });
}
export function useBirthdays() {
  return useQuery({
    queryKey: ["admin", "birthdays"],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/customers/birthdays`)),
  });
}

export function useToggleEmailFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/emails/${id}/toggle`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "emails"] }),
  });
}

export function useUpdateEmailFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; subject?: string; template?: string } }) =>
      apiFetch(`/emails/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "emails"] }),
  });
}

export function useCreateEmailFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; trigger: string; subject?: string; template?: string; active?: boolean }) =>
      apiFetch(`/emails`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "emails"] }),
  });
}

export function useDeleteEmailFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/emails/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "emails"] }),
  });
}

// ─────────── Descuentos / promos ───────────
export function useDiscounts() {
  return useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/discounts`)),
  });
}
export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/discounts`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "discounts"] }),
  });
}
export function useUpdateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiFetch(`/discounts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "discounts"] }),
  });
}
export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/discounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "discounts"] }),
  });
}

// ─────────── Configuración del sitio (apariencia) ───────────
export function useSettings() {
  return useQuery({ queryKey: ["admin", "settings"], queryFn: () => apiFetch<any>(`/settings`) });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/settings`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public", "settings"] });
    },
  });
}

/** Hook público para leer settings desde la tienda (sin auth). */
export function usePublicSettings() {
  return useQuery({
    queryKey: ["public", "settings"],
    queryFn: () => apiFetch<any>(`/settings`),
    staleTime: 60 * 1000,
  });
}

// ─────────── Media upload ───────────
export function useUploadMedia(folder?: "hero" | "products" | "variants" | "categories") {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const { API_URL, ADMIN_TOKEN_KEY } = await import("@/lib/api/client");
      const bearer = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
      const form = new FormData();
      form.append("file", file);
      if (folder) form.append("folder", folder);
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json();
    },
  });
}

// ─────────── Categorías ───────────
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => unwrap<any[]>(await apiFetch<any>(`/categories`)),
  });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch(`/categories`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

// ─────────── Sugerencias de variantes (más usadas) ───────────
export function useVariantSuggestions() {
  return useQuery({
    queryKey: ["admin", "variant-suggestions"],
    queryFn: () => apiFetch<Record<string, { value: string; uses: number }[]>>(`/variant-suggestions`),
  });
}

// ─────────── Notificaciones del panel ───────────
export type AdminNotifItem = {
  type: "pending_orders" | "low_stock" | "new_customers";
  label: string;
  href: string;
  count: number;
};
export type AdminNotifications = { total: number; items: AdminNotifItem[] };

export function useAdminNotifications() {
  return useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => apiFetch<AdminNotifications>("/admin/notifications"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ─────────── Búsqueda global del panel ───────────
export type SearchResultItem = { id: number; label: string; sub: string; href: string };
export type AdminSearchResults = {
  products: SearchResultItem[];
  orders: SearchResultItem[];
  customers: SearchResultItem[];
};

export function useAdminSearch(q: string) {
  return useQuery({
    queryKey: ["admin", "search", q],
    queryFn: () => apiFetch<AdminSearchResults>(`/admin/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
    staleTime: 15_000,
  });
}

// ─────────── Perfil del staff autenticado ───────────
export function useUpdateStaffProfile() {
  return useMutation({
    mutationFn: (body: {
      name?: string;
      email?: string;
      phone?: string;
      current_password?: string;
      password?: string;
      password_confirmation?: string;
    }) => apiFetch<any>("/admin/profile", { method: "PUT", body: JSON.stringify(body) }),
  });
}

// ─────────── Usuarios staff (Configuración) ───────────
export type StaffUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "vendedor";
  /** NULL para admin (ve todo). Para vendedor, lista de claves de módulo visibles. */
  permissions?: string[] | null;
  active: boolean;
  phone?: string | null;
};

export function useAdminStaffUsers() {
  return useQuery({
    queryKey: ["admin", "staff-users"],
    queryFn: async () => unwrap<StaffUser[]>(await apiFetch<any>("/admin/users")),
  });
}

export function useCreateStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string; email: string; role: string; phone?: string; password: string; permissions?: string[];
    }) => apiFetch<StaffUser>("/admin/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff-users"] }),
  });
}

export function useUpdateStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<StaffUser & { password?: string }> }) =>
      apiFetch<StaffUser>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff-users"] }),
  });
}

// ─────────── Calibración de etiquetas de joyería ───────────
export type LabelSettings = {
  pageW: number; pageH: number; earW: number; earH: number;
  barcodeSide: "left" | "right"; codeType: "qr" | "barcode";
  bcFill: number; offsetX: number; offsetY: number;
};

export function useLabelSettings() {
  return useQuery({
    queryKey: ["admin", "label-settings"],
    queryFn: () => apiFetch<LabelSettings>("/admin/label-settings"),
    staleTime: Infinity,
  });
}

export function useSaveLabelSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LabelSettings) =>
      apiFetch<LabelSettings>("/admin/label-settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (data) => qc.setQueryData(["admin", "label-settings"], data),
  });
}

export function useResetLabelSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<LabelSettings>("/admin/label-settings", { method: "DELETE" }),
    onSuccess: (data) => qc.setQueryData(["admin", "label-settings"], data),
  });
}

// ─────────── Bloques conversacionales de WhatsApp ───────────
export type WhatsAppAutomation = {
  welcome_enabled: boolean;
  ice_breakers: string[];
  commands: { name: string; description: string }[];
};

export function useWhatsAppAutomation() {
  return useQuery({
    queryKey: ["admin", "whatsapp-automation"],
    queryFn: () => apiFetch<WhatsAppAutomation>("/admin/whatsapp-automation"),
  });
}

export function useSaveWhatsAppAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WhatsAppAutomation) =>
      apiFetch<{ saved: boolean; synced: boolean; error: string | null }>("/admin/whatsapp-automation", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (_r, body) => qc.setQueryData(["admin", "whatsapp-automation"], body),
  });
}

export function useWhatsAppAutomationLive() {
  return useQuery({
    queryKey: ["admin", "whatsapp-automation-live"],
    queryFn: () => apiFetch<{ ok: boolean; body?: any; error?: string }>("/admin/whatsapp-automation/live"),
    enabled: false,
  });
}

// ─────────── Bandeja de entrada de WhatsApp ───────────
export type WaConversation = {
  waId: string;
  name: string | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
  aiPaused: boolean;
  archived: boolean;
};

export type WaMessage = {
  id: number;
  direction: "in" | "out";
  sender: "customer" | "ai" | "staff";
  body: string | null;
  type: string;
  at: string | null;
};

export function useWaAiStatus() {
  return useQuery({
    queryKey: ["admin", "wa-ai-status"],
    queryFn: () => apiFetch<{ enabled: boolean }>("/admin/whatsapp/ai-status"),
    refetchInterval: 15000,
  });
}

export function useToggleWaAiGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ enabled: boolean }>("/admin/whatsapp/ai-status/toggle", { method: "POST" }),
    onSuccess: (data) => qc.setQueryData(["admin", "wa-ai-status"], data),
  });
}

// ─────────── Aprendizajes de la IA (WhatsApp + chat de la tienda) ───────────
export type AiLesson = { id: number; content: string; active: boolean };

export function useAiLessons() {
  return useQuery({
    queryKey: ["admin", "ai-lessons"],
    queryFn: () => apiFetch<AiLesson[]>("/admin/ai-lessons"),
  });
}

export function useCreateAiLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<AiLesson>("/admin/ai-lessons", { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ai-lessons"] }),
  });
}

export function useUpdateAiLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, active }: { id: number; content?: string; active?: boolean }) =>
      apiFetch<AiLesson>(`/admin/ai-lessons/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content, active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ai-lessons"] }),
  });
}

export function useDeleteAiLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/ai-lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ai-lessons"] }),
  });
}

export function useWaConversations(archived = false) {
  return useQuery({
    queryKey: ["admin", "wa-conversations", archived],
    queryFn: () => apiFetch<WaConversation[]>(`/admin/whatsapp/conversations${archived ? "?archived=1" : ""}`),
    refetchInterval: 8000, // refresca la lista cada 8s
  });
}

export function useWaMessages(waId: string | null) {
  return useQuery({
    queryKey: ["admin", "wa-messages", waId],
    queryFn: () =>
      apiFetch<{ conversation: WaConversation | null; messages: WaMessage[] }>(
        `/admin/whatsapp/conversations/${waId}/messages`,
      ),
    enabled: !!waId,
    refetchInterval: waId ? 5000 : false, // refresca el hilo abierto cada 5s
  });
}

export function useSendWaMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ waId, body }: { waId: string; body: string }) =>
      apiFetch<{ sent: boolean }>(`/admin/whatsapp/conversations/${waId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: (_r, { waId }) => {
      qc.invalidateQueries({ queryKey: ["admin", "wa-messages", waId] });
      qc.invalidateQueries({ queryKey: ["admin", "wa-conversations"] });
    },
  });
}

export function useToggleWaAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (waId: string) =>
      apiFetch<{ ai_paused: boolean }>(`/admin/whatsapp/conversations/${waId}/toggle-ai`, { method: "POST" }),
    onSuccess: (_r, waId) => {
      qc.invalidateQueries({ queryKey: ["admin", "wa-messages", waId] });
      qc.invalidateQueries({ queryKey: ["admin", "wa-conversations"] });
    },
  });
}

export function useToggleWaArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (waId: string) =>
      apiFetch<{ archived: boolean }>(`/admin/whatsapp/conversations/${waId}/toggle-archive`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "wa-conversations"] }),
  });
}

export function useDeleteWaConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (waId: string) =>
      apiFetch<{ deleted: boolean }>(`/admin/whatsapp/conversations/${waId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "wa-conversations"] }),
  });
}


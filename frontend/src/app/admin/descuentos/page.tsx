"use client";

import { useState } from "react";
import { Check, Copy, Edit2, Link2, Percent, Plus, Trash2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  useAdminCategories,
  useAdminProducts,
  useCreateDiscount,
  useDeleteDiscount,
  useDiscounts,
  useUpdateDiscount,
} from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";

const SCOPE_LABEL: Record<string, string> = {
  all: "Todo el catálogo",
  category: "Categoría",
  products: "Productos seleccionados",
};

const EMPTY = {
  name: "", type: "percent", value: "", scope: "all",
  category_id: "", product_ids: [] as string[],
  starts_at: "", ends_at: "", requires_token: false, active: true,
};

export default function AdminDescuentos() {
  const { data: discounts = [], isLoading } = useDiscounts();
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const create = useCreateDiscount();
  const update = useUpdateDiscount();
  const del    = useDeleteDiscount();

  const [form, setForm]       = useState<any>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg]         = useState("");
  const [copied, setCopied]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  function toggleProduct(id: string) {
    setForm((f: any) => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter((p: string) => p !== id)
        : [...f.product_ids, id],
    }));
  }

  function startEdit(d: any) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      type: d.type,
      value: String(d.value),
      scope: d.scope,
      category_id: d.categoryId ?? "",
      product_ids: (d.productIds ?? []).map(String),
      starts_at: d.startsAt ?? "",
      ends_at: d.endsAt ?? "",
      requires_token: d.requiresToken,
      active: d.active,
    });
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setMsg("");
  }

  async function save() {
    setMsg("");
    const body: any = {
      name: form.name,
      type: form.type,
      value: Number(form.value),
      scope: form.scope,
      category_id: form.scope === "category" && form.category_id ? Number(form.category_id) : null,
      product_ids: form.scope === "products" ? form.product_ids.map(Number) : null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      active: form.active,
      requires_token: !!form.requires_token,
    };
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, body });
        setMsg("✓ Descuento actualizado");
        cancelEdit();
      } else {
        await create.mutateAsync(body);
        setForm(EMPTY);
        setMsg("✓ Descuento creado");
      }
    } catch {
      setMsg("Error al guardar. Revisá los campos.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id);
      setConfirmDelete(null);
      if (editingId === id) cancelEdit();
    } catch {
      setMsg("Error al eliminar.");
    }
  }

  async function toggleActive(d: any) {
    try {
      await update.mutateAsync({
        id: d.id,
        body: {
          name: d.name, type: d.type, value: d.value, scope: d.scope,
          category_id: d.categoryId ? Number(d.categoryId) : null,
          product_ids: d.productIds?.map(Number) ?? null,
          starts_at: d.startsAt ?? null, ends_at: d.endsAt ?? null,
          active: !d.active, requires_token: d.requiresToken,
        },
      });
    } catch { /* silent */ }
  }

  function copyLink(link: string, id: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => fallbackCopy(link));
    } else {
      fallbackCopy(link);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  function fallbackCopy(text: string) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  const isPending = create.isPending || update.isPending;
  const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <>
      <PageHeader
        title="Descuentos"
        description="Aplicá % o monto fijo a todo el catálogo, una categoría o productos puntuales, por tiempo limitado."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ── Lista ── */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <Spinner className="text-brand" />
          ) : discounts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
              Todavía no hay descuentos. Creá el primero →
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {discounts.map((d: any) => (
                <div
                  key={d.id}
                  className={`rounded-2xl border bg-white p-5 transition ${
                    editingId === d.id ? "border-brand/40 ring-1 ring-brand/20" : "border-line"
                  }`}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700">
                        <Percent className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-sm text-ink leading-tight">{d.name}</span>
                    </span>
                    <button
                      onClick={() => toggleActive(d)}
                      className="shrink-0"
                      title={d.active ? "Pausar descuento" : "Activar descuento"}
                    >
                      <Badge className={d.live ? "bg-green-50 text-green-700 cursor-pointer hover:bg-green-100" : d.active ? "bg-amber-50 text-amber-700 cursor-pointer hover:bg-amber-100" : "bg-stone-100 text-muted cursor-pointer hover:bg-stone-200"}>
                        {d.live ? "vigente" : d.active ? "programado" : "pausado"}
                      </Badge>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 border-t border-line pt-3 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Descuento</span>
                      <span className="font-semibold text-brand">
                        {d.type === "percent" ? `${d.value}%` : formatPrice(d.value)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Aplica a</span>
                      <span>
                        {SCOPE_LABEL[d.scope]}
                        {d.scope === "category" && d.categoryName ? ` · ${d.categoryName}` : ""}
                        {d.scope === "products" && d.productIds?.length ? ` (${d.productIds.length})` : ""}
                      </span>
                    </div>
                    {d.startsAt && (
                      <div className="flex justify-between">
                        <span className="text-muted">Desde</span>
                        <span>{d.startsAt}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Hasta</span>
                      <span>{d.endsAt ?? "Sin vencimiento"}</span>
                    </div>
                  </div>

                  {/* Promo link */}
                  {d.link && (
                    <button
                      onClick={() => copyLink(d.link, d.id)}
                      className="mt-3 flex w-full items-center gap-2 rounded-xl border border-line bg-stone-50 px-3 py-2 text-left text-xs text-body transition hover:border-brand"
                    >
                      {copied === d.id
                        ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        : <Link2 className="h-3.5 w-3.5 shrink-0 text-gold-700" />}
                      <span className="flex-1 truncate font-mono">
                        {copied === d.id ? "¡Link copiado!" : d.link}
                      </span>
                      <Copy className="ml-auto h-3.5 w-3.5 shrink-0 text-muted" />
                    </button>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <button
                      onClick={() => startEdit(d)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted transition hover:bg-stone-100 hover:text-ink"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>

                  {/* Confirm delete */}
                  {confirmDelete === d.id && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs">
                      <span className="flex-1 text-red-700">¿Eliminar este descuento?</span>
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={del.isPending}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-white hover:bg-red-700"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg px-2.5 py-1 text-red-700 hover:bg-red-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Formulario ── */}
        <Card title={editingId ? "Editar descuento" : "Crear descuento"}>
          <div className="flex flex-col gap-3.5">
            {/* Nombre */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Nombre <span className="text-brand">*</span></span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="20% OFF en Aros"
                className={inp}
              />
            </label>

            {/* Tipo + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Tipo</span>
                <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inp}>
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Valor <span className="text-brand">*</span></span>
                <input
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === "percent" ? "20" : "5000"}
                  className={inp}
                />
              </label>
            </div>

            {/* Alcance */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Aplica a</span>
              <select value={form.scope} onChange={(e) => set("scope", e.target.value)} className={inp}>
                <option value="all">Todo el catálogo</option>
                <option value="category">Una categoría</option>
                <option value="products">Productos seleccionados</option>
              </select>
            </label>

            {form.scope === "category" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Categoría</span>
                <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inp}>
                  <option value="">Elegí una categoría…</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}

            {form.scope === "products" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">
                  Productos ({form.product_ids.length} seleccionados)
                </span>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-line p-2">
                  {products.map((p: any) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-stone-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.product_ids.includes(String(p.id))}
                        onChange={() => toggleProduct(String(p.id))}
                        className="accent-brand"
                      />
                      <span className="flex-1 truncate text-body">{p.name}</span>
                      <span className="text-muted">{formatPrice(p.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Desde / Hasta */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Desde <span className="font-normal text-muted">(opcional)</span></span>
                <input
                  type="date"
                  value={form.starts_at}
                  onChange={(e) => set("starts_at", e.target.value)}
                  className={inp}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Hasta <span className="font-normal text-muted">(opcional)</span></span>
                <input
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => set("ends_at", e.target.value)}
                  className={inp}
                />
              </label>
            </div>

            {/* Solo con link */}
            <label className="flex items-start gap-2.5 rounded-xl border border-line px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={form.requires_token}
                onChange={(e) => set("requires_token", e.target.checked)}
                className="accent-brand mt-0.5"
              />
              <span className="text-xs text-body">
                Solo con link único{" "}
                <span className="text-muted">(no se muestra en la tienda salvo con el link)</span>
              </span>
            </label>

            {/* Activo toggle (solo edición) */}
            {editingId && (
              <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-ink">
                <span
                  onClick={() => set("active", !form.active)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    form.active ? "bg-brand" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 ml-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      form.active ? "translate-x-4" : ""
                    }`}
                  />
                </span>
                {form.active ? "Activo" : "Pausado"}
              </label>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={isPending || !form.name || !form.value}
                className="btn-brand flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs"
              >
                {isPending ? <Spinner /> : <><Plus className="h-4 w-4" /> {editingId ? "Guardar cambios" : "Crear descuento"}</>}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="rounded-xl border border-line px-3 py-2.5 text-xs text-muted hover:bg-stone-50"
                >
                  Cancelar
                </button>
              )}
            </div>

            {msg && <p className="text-center text-xs text-body">{msg}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

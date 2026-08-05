"use client";

import { useState } from "react";
import { Edit2, Globe, Lock, Mail, Plus, Send, Tag, Trash2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useSendCouponEmail,
  useUpdateCoupon,
} from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";

const EMPTY = {
  code: "", type: "percent", value: "", min_subtotal: "", max_uses: "",
  expires_at: "", description: "", is_public: true, active: true, send_to_email: "",
};

export default function AdminCupones() {
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const create  = useCreateCoupon();
  const update  = useUpdateCoupon();
  const destroy = useDeleteCoupon();
  const sendEmail = useSendCouponEmail();

  const [form, setForm]         = useState<any>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<{ id: string; email: string } | null>(null);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  function startEdit(c: any) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      min_subtotal: c.minSubtotal ? String(c.minSubtotal) : "",
      max_uses: c.maxUses ? String(c.maxUses) : "",
      expires_at: c.expiresAt ?? "",
      description: c.description ?? "",
      is_public: c.isPublic,
      active: c.active,
      send_to_email: "",
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
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_subtotal: form.min_subtotal ? Number(form.min_subtotal) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      description: form.description || null,
      is_public: form.is_public,
      active: form.active,
    };
    if (!form.is_public && form.send_to_email) {
      body.send_to_email = form.send_to_email;
    }
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, body });
        setMsg("✓ Cupón actualizado");
        cancelEdit();
      } else {
        await create.mutateAsync(body);
        setForm(EMPTY);
        setMsg("✓ Cupón creado");
      }
    } catch {
      setMsg("Error al guardar. ¿Código repetido?");
    }
  }

  async function handleDelete(id: string) {
    try {
      await destroy.mutateAsync(id);
      setConfirmDelete(null);
      if (editingId === id) cancelEdit();
    } catch {
      setMsg("Error al eliminar.");
    }
  }

  async function handleSend(id: string, email: string) {
    try {
      await sendEmail.mutateAsync({ id, email });
      setSendingTo(null);
    } catch {
      /* silent */
    }
  }

  const isPending = create.isPending || update.isPending;
  const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <>
      <PageHeader
        title="Cupones"
        description="Descuentos por código: porcentaje o monto fijo, con mínimos, límites y vencimiento."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ── Lista ── */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <Spinner className="text-brand" />
          ) : coupons.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay cupones.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {coupons.map((c: any) => (
                <div
                  key={c.id}
                  className={`rounded-2xl border bg-white p-5 transition ${
                    editingId === c.id ? "border-brand/40 ring-1 ring-brand/20" : "border-line"
                  }`}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700">
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-ink">{c.code}</span>
                        {c.description && (
                          <span className="text-[11px] text-muted leading-tight">{c.description}</span>
                        )}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={c.active ? "bg-green-50 text-green-700" : "bg-stone-100 text-muted"}>
                        {c.active ? "activo" : "pausado"}
                      </Badge>
                      {c.isPublic ? (
                        <span title="Público" className="text-muted"><Globe className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span title="Privado" className="text-muted"><Lock className="h-3.5 w-3.5" /></span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 border-t border-line pt-3 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Descuento</span>
                      <span className="font-semibold text-brand">
                        {c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}
                      </span>
                    </div>
                    {c.minSubtotal && (
                      <div className="flex justify-between">
                        <span className="text-muted">Mínimo</span>
                        <span>{formatPrice(c.minSubtotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Usos</span>
                      <span>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Vence</span>
                      <span>{c.expiresAt ?? "Sin vencimiento"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <button
                      onClick={() => startEdit(c)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted transition hover:bg-stone-100 hover:text-ink"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </button>
                    {!c.isPublic && (
                      <button
                        onClick={() => setSendingTo({ id: c.id, email: "" })}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted transition hover:bg-stone-100 hover:text-ink"
                      >
                        <Mail className="h-3.5 w-3.5" /> Enviar
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>

                  {/* Confirm delete inline */}
                  {confirmDelete === c.id && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs">
                      <span className="flex-1 text-red-700">¿Eliminar este cupón?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={destroy.isPending}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-white hover:bg-red-700"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg px-2.5 py-1 text-red-700 hover:bg-red-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Send email inline */}
                  {sendingTo?.id === c.id && (() => {
                    const st = sendingTo!;
                    return (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                      <input
                        type="email"
                        value={st.email}
                        onChange={(e) => setSendingTo({ id: c.id, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                      />
                      <button
                        onClick={() => handleSend(c.id, st.email)}
                        disabled={sendEmail.isPending || !st.email}
                        className="grid place-items-center rounded-lg bg-brand px-2.5 py-1.5 text-white hover:opacity-90 disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSendingTo(null)}
                        className="text-xs text-muted hover:text-ink"
                      >
                        ✕
                      </button>
                    </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Formulario ── */}
        <Card title={editingId ? "Editar cupón" : "Crear cupón"}>
          <div className="flex flex-col gap-3.5">
            {/* Código */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Código <span className="text-brand">*</span></span>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="VERANO20"
                className={`${inp} font-mono uppercase`}
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

            {/* Descripción */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Descripción <span className="font-normal text-muted">(opcional)</span></span>
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Para nuevos clientes"
                className={inp}
              />
            </label>

            {/* Mínimo */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Mínimo de compra <span className="font-normal text-muted">(opcional)</span></span>
              <input
                value={form.min_subtotal}
                onChange={(e) => set("min_subtotal", e.target.value)}
                placeholder="50000"
                className={inp}
              />
            </label>

            {/* Usos + Vencimiento */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Límite usos <span className="font-normal text-muted">(opcional)</span></span>
                <input
                  value={form.max_uses}
                  onChange={(e) => set("max_uses", e.target.value)}
                  placeholder="100"
                  className={inp}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Vence <span className="font-normal text-muted">(opcional)</span></span>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => set("expires_at", e.target.value)}
                  className={inp}
                />
              </label>
            </div>

            {/* Público / Privado */}
            <div className="flex items-center gap-3 rounded-xl border border-line p-3">
              <button
                type="button"
                onClick={() => set("is_public", true)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition ${
                  form.is_public ? "bg-brand text-white" : "text-muted hover:bg-stone-100"
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> Público
              </button>
              <button
                type="button"
                onClick={() => set("is_public", false)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition ${
                  !form.is_public ? "bg-ink text-white" : "text-muted hover:bg-stone-100"
                }`}
              >
                <Lock className="h-3.5 w-3.5" /> Privado
              </button>
            </div>

            {/* Email opcional para privado */}
            {!form.is_public && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">
                  Enviar al crear <span className="font-normal text-muted">(opcional)</span>
                </span>
                <input
                  type="email"
                  value={form.send_to_email}
                  onChange={(e) => set("send_to_email", e.target.value)}
                  placeholder="cliente@email.com"
                  className={inp}
                />
              </label>
            )}

            {/* Activo toggle (solo en edición) */}
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
                disabled={isPending || !form.code || !form.value}
                className="btn-brand flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs"
              >
                {isPending ? <Spinner /> : <><Plus className="h-4 w-4" /> {editingId ? "Guardar cambios" : "Crear cupón"}</>}
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

"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  type Address,
  useCreateAddress,
  useDeleteAddress,
  useMyAddresses,
  useUpdateAddress,
} from "@/lib/api/account";
import { LoadingScreen, Spinner } from "@/components/ui/spinner";

type FormState = {
  label: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  is_default: boolean;
};

const EMPTY_FORM: FormState = { label: "Casa", street: "", city: "", province: "", zip: "", is_default: false };

const inp = "rounded-xl border border-line px-4 py-2.5 text-sm outline-none transition focus:border-brand w-full";

export default function DireccionesPage() {
  const { data: addresses = [], isLoading } = useMyAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();

  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; address: Address }>(null);
  const [form, setForm]   = useState<FormState>(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function openCreate() {
    setForm({ ...EMPTY_FORM, is_default: addresses.length === 0 });
    setModal({ mode: "create" });
  }

  function openEdit(a: Address) {
    setForm({ label: a.label, street: a.street, city: a.city, province: a.province ?? "", zip: a.zip ?? "", is_default: a.is_default });
    setModal({ mode: "edit", address: a });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (modal?.mode === "create") {
      await create.mutateAsync(form);
    } else if (modal?.mode === "edit") {
      await update.mutateAsync({ id: modal.address.id, body: form });
    }
    setModal(null);
  }

  async function confirmDelete(id: number) {
    await remove.mutateAsync(id);
    setConfirmId(null);
  }

  const isPending = create.isPending || update.isPending;

  if (isLoading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Mis direcciones</h1>
          <p className="mt-1 text-sm text-body">Gestioná tus direcciones de envío guardadas.</p>
        </div>
        <button onClick={openCreate} className="btn-brand flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Agregar dirección
        </button>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-ink">
                <MapPin className="h-4 w-4 shrink-0 text-brand" />
                {a.label}
              </span>
              {a.is_default && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  <Star className="h-3 w-3" /> Predeterminada
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-body">{a.street}</p>
            <p className="text-sm text-body">
              {a.city}
              {a.province ? `, ${a.province}` : ""}
              {a.zip ? ` (${a.zip})` : ""}
            </p>

            {confirmId === a.id ? (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                <p className="mb-2">¿Eliminar esta dirección?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmId(null)} className="rounded-lg border border-line bg-white px-3 py-1 text-ink">Cancelar</button>
                  <button onClick={() => confirmDelete(a.id)} disabled={remove.isPending} className="rounded-lg bg-red-600 px-3 py-1 font-medium text-white disabled:opacity-50">
                    {remove.isPending ? <Spinner className="h-3 w-3" /> : "Eliminar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-3 border-t border-line pt-3">
                <button onClick={() => openEdit(a)} className="flex items-center gap-1.5 text-xs font-medium text-ink hover:text-brand">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <span className="text-line">·</span>
                <button onClick={() => setConfirmId(a.id)} className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
                {!a.is_default && (
                  <>
                    <span className="text-line">·</span>
                    <button
                      onClick={() => update.mutate({ id: a.id, body: { is_default: true } })}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-brand"
                    >
                      <Star className="h-3.5 w-3.5" /> Predeterminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Tarjeta de nueva dirección */}
        <button
          onClick={openCreate}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted transition hover:border-brand hover:text-brand"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Nueva dirección</span>
        </button>
      </div>

      {/* ─── Modal crear / editar ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">
                {modal.mode === "create" ? "Nueva dirección" : "Editar dirección"}
              </h3>
              <button onClick={() => setModal(null)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-body">Etiqueta <span className="text-brand">*</span></span>
                <input
                  required
                  placeholder="Casa, Trabajo…"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className={inp}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-body">Calle y número <span className="text-brand">*</span></span>
                <input
                  required
                  placeholder="Av. Corrientes 1234"
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  className={inp}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-body">Ciudad <span className="text-brand">*</span></span>
                  <input
                    required
                    placeholder="Buenos Aires"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className={inp}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-body">Provincia <span className="text-xs text-muted">(opcional)</span></span>
                  <input
                    placeholder="CABA"
                    value={form.province}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                    className={inp}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-body">Código postal <span className="text-xs text-muted">(opcional)</span></span>
                <input
                  placeholder="C1043"
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className={inp}
                />
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-line accent-brand"
                />
                <span className="text-sm text-body">Usar como dirección predeterminada</span>
              </label>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-line px-4 py-2 text-sm text-ink hover:bg-stone-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="btn-brand px-5 py-2 text-sm disabled:opacity-50">
                  {isPending ? <Spinner /> : modal.mode === "create" ? "Guardar" : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

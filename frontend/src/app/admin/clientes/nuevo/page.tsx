"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCustomer } from "@/lib/api/admin";

export default function NuevoCliente() {
  const router = useRouter();
  const create = useCreateCustomer();
  const [form, setForm] = useState<any>({ name: "", email: "", phone: "", birthday: "", segment: "nuevo", tags: "", notes: "" });
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  async function save() {
    setError("");
    try {
      await create.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        birthday: form.birthday || null,
        segment: form.segment,
        vip: form.segment === "vip",
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        notes: form.notes || null,
      });
      router.push("/admin/clientes");
    } catch {
      setError("No se pudo crear (¿el email ya existe?).");
    }
  }

  return (
    <>
      <PageHeader
        title="Nuevo cliente"
        description="Alta manual. También se crean automáticamente al comprar o vincular email en el POS."
        action={
          <div className="flex gap-2">
            <Link href="/admin/clientes" className="btn-outline px-4 py-2 text-xs">Cancelar</Link>
            <button onClick={save} disabled={create.isPending || !form.name} className="btn-brand px-4 py-2 text-xs">
              {create.isPending ? <Spinner /> : "Guardar cliente"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card title="Datos del cliente">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-ink">Nombre completo <span className="text-brand">*</span></span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="María Pérez" className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-ink">Email <span className="font-normal text-muted">(opcional)</span></span>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="cliente@email.com" className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-ink">Teléfono <span className="font-normal text-muted">(opcional)</span></span>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+54 9 11 …" className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-ink">Cumpleaños <span className="font-normal text-muted">(opcional)</span></span>
                <input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" /></label>
            </div>
            {error && <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>}
          </Card>

          <Card title="Notas internas">
            <p className="mb-2 text-xs text-muted">Opcional</p>
            <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Preferencias, talle de anillo…" className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          </Card>
        </div>

        <div className="flex h-fit flex-col gap-5">
          <Card title="Segmento inicial">
            <div className="flex flex-col gap-2.5 text-sm">
              {[["nuevo", "Nuevo"], ["recurrente", "Recurrente"], ["vip", "VIP ⭐"]].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-body">
                  <input type="radio" name="segmento" checked={form.segment === v} onChange={() => set("segment", v)} className="accent-brand" /> {l}
                </label>
              ))}
              <p className="mt-1 flex items-start gap-2 rounded-xl bg-gold-50 px-3.5 py-2.5 text-xs text-body">
                <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" />
                El segmento se recalcula automáticamente según su comportamiento, salvo VIP manual.
              </p>
            </div>
          </Card>
          <Card title="Etiquetas">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Separadas por coma <span className="font-normal text-muted">(opcional)</span></span>
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="mayorista, influencer…" className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            </label>
          </Card>
        </div>
      </div>
    </>
  );
}

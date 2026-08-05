"use client";

import { useState } from "react";
import { Cake, Mail, Pencil, Trash2, X } from "lucide-react";
import { Badge, Card, CardGrid, KV, PageHeader, StatCard, Toggle } from "@/components/admin/ui";
import { LoadingScreen } from "@/components/ui/spinner";
import {
  useBirthdays,
  useDeleteEmailFlow,
  useEmailFlows,
  useToggleEmailFlow,
  useUpdateEmailFlow,
} from "@/lib/api/admin";

const TRIGGER_LABELS: Record<string, string> = {
  welcome:        "Al registrarse",
  abandoned_cart: "1 h después de abandonar el carrito",
  birthday:       "7 días antes del cumpleaños",
  post_purchase:  "3 días después de la entrega",
  reactivation:   "Sin compras por 90 días",
};

type Flow = {
  id: number;
  name: string;
  trigger: string;
  subject: string | null;
  template: string | null;
  sent: number;
  active: boolean;
  builtIn: boolean;
};

type EditState = {
  id: number;
  name: string;
  subject: string;
  template: string;
};


export default function AdminEmails() {
  const { data: flows = [], isLoading } = useEmailFlows();
  const { data: birthdays = [] } = useBirthdays();
  const toggle = useToggleEmailFlow();
  const updateFlow = useUpdateEmailFlow();
  const deleteFlow = useDeleteEmailFlow();

  const [editing, setEditing] = useState<EditState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const totalSent = (flows as Flow[]).reduce((s, f) => s + f.sent, 0);
  const active = (flows as Flow[]).filter((f) => f.active).length;

  function openEdit(f: Flow) {
    setEditing({
      id: f.id,
      name: f.name,
      subject: f.subject ?? "",
      template: f.template ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    await updateFlow.mutateAsync({
      id: editing.id,
      body: { name: editing.name, subject: editing.subject, template: editing.template },
    });
    setEditing(null);
  }

  async function handleDelete(id: number) {
    await deleteFlow.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) return <LoadingScreen label="Cargando secuencias…" />;

  return (
    <>
      <PageHeader
        title="Emails automáticos"
        description="Bienvenida, carrito abandonado, cumpleaños, post-compra y reactivación."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Emails enviados" value={totalSent.toLocaleString("es-AR")} />
        <StatCard label="Secuencias activas" value={`${active} / ${flows.length}`} />
        <StatCard label="Cumpleaños este mes" value={String(birthdays.length)} icon={<Cake className="h-5 w-5" />} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Secuencias</h2>
          <CardGrid className="xl:grid-cols-2">
            {(flows as Flow[]).map((f) => (
              <div key={f.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium leading-snug text-ink">{f.name}</span>
                  </span>
                  <button onClick={() => toggle.mutate(f.id)} aria-label="Activar/Pausar">
                    <Toggle on={f.active} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                  <KV label="Disparador">
                    {TRIGGER_LABELS[f.trigger] ?? f.trigger}
                  </KV>
                  <KV label="Enviados">{f.sent}</KV>
                  {f.subject && (
                    <KV label="Asunto">
                      <span className="truncate text-[11px] text-muted">{f.subject}</span>
                    </KV>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => openEdit(f)}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink transition hover:bg-stone-bg"
                  >
                    <Pencil className="h-3 w-3" /> Editar contenido
                  </button>
                  {!f.builtIn && (
                    <button
                      onClick={() => setConfirmDelete(f.id)}
                      className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {confirmDelete === f.id && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                    <p className="mb-2">¿Eliminar este flujo? Esta acción no se puede deshacer.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border border-line bg-white px-3 py-1 text-ink"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deleteFlow.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1 font-medium text-white disabled:opacity-50"
                      >
                        {deleteFlow.isPending ? "Eliminando…" : "Sí, eliminar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardGrid>
        </div>

        <Card title="Campaña de cumpleaños">
          <div className="rounded-xl bg-khaki-100 p-4">
            <p className="flex items-center gap-2 font-display text-lg text-ink">
              <Cake className="h-5 w-5 text-gold-700" /> Próximos cumpleaños
            </p>
            {birthdays.length === 0 ? (
              <p className="mt-3 text-sm text-body">No hay cumpleaños este mes.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-sm">
                {(birthdays as any[]).slice(0, 6).map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <span className="text-ink">{b.name} · {b.birthday}</span>
                    <Badge className="bg-white text-gold-700">programado</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Se envía</dt>
              <dd className="text-ink">7 días antes</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Cupón</dt>
              <dd className="font-mono text-ink">CUMPLE25 · 25%</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* ─── Modal: editar flujo ─── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Editar email</h3>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Nombre del flujo</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Asunto del email</span>
                <input
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="Asunto que verá el destinatario…"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Mensaje principal</span>
                <span className="text-xs text-muted">
                  Reemplaza el párrafo introductorio del email. El diseño y el cupón se mantienen.
                </span>
                <textarea
                  value={editing.template}
                  onChange={(e) => setEditing({ ...editing, template: e.target.value })}
                  rows={5}
                  placeholder="Escribí aquí el texto del email…"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand resize-none"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border border-line px-4 py-2 text-sm text-ink hover:bg-stone-bg"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={updateFlow.isPending}
                className="btn-brand px-5 py-2 text-sm disabled:opacity-50"
              >
                {updateFlow.isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

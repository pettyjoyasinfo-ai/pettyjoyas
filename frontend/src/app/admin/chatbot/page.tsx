"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, ArchiveRestore, Bot, Check, GraduationCap, MessageCircle, MoreVertical, Pause, Pencil, Play, Plus, Power, Send, SlidersHorizontal, Trash2, User, X } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  useAiLessons,
  useCreateAiLesson,
  useDeleteAiLesson,
  useDeleteWaConversation,
  useSendWaMessage,
  useToggleWaAi,
  useToggleWaAiGlobal,
  useToggleWaArchive,
  useUpdateAiLesson,
  useWaAiStatus,
  useWaConversations,
  useWaMessages,
  type AiLesson,
  type WaConversation,
  type WaMessage,
} from "@/lib/api/admin";

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yest.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Paleta de fondos para los avatares con iniciales (WhatsApp no da la foto real
// del cliente, así que usamos iniciales sobre un color estable según el número).
const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700", "bg-fuchsia-100 text-fuchsia-700",
];

function initials(name: string | null, waId: string) {
  const base = (name || "").trim();
  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || base[0].toUpperCase();
  }
  return waId.slice(-2); // sin nombre: últimos 2 dígitos del número
}

function avatarColor(waId: string) {
  let sum = 0;
  for (const ch of waId) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function Avatar({ name, waId, size }: { name: string | null; waId: string; size: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${avatarColor(waId)} ${size}`}>
      {initials(name, waId)}
    </span>
  );
}

export default function AdminWhatsAppInbox() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: conversations = [], isLoading } = useWaConversations(showArchived);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: aiStatus } = useWaAiStatus();
  const toggleGlobalAi = useToggleWaAiGlobal();
  const aiEnabled = aiStatus?.enabled ?? false;

  const [configOpen, setConfigOpen] = useState(false);

  const { data: thread } = useWaMessages(activeId);
  const send = useSendWaMessage();
  const toggleAi = useToggleWaAi();
  const toggleArchive = useToggleWaArchive();
  const deleteConvo = useDeleteWaConversation();

  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleArchive() {
    if (!activeId) return;
    setMenuOpen(false);
    await toggleArchive.mutateAsync(activeId);
    setActiveId(null); // sale de la lista actual
  }

  async function handleDelete() {
    if (!activeId) return;
    await deleteConvo.mutateAsync(activeId);
    setConfirmDelete(false);
    setMenuOpen(false);
    setActiveId(null);
  }

  const active = useMemo(
    () => conversations.find((c) => c.waId === activeId) ?? thread?.conversation ?? null,
    [conversations, activeId, thread],
  );
  const messages = thread?.messages ?? [];

  // Auto-scroll al final cuando llegan mensajes o se cambia de chat.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  // Al cambiar de conversación, cerrar menús y limpiar estados de la anterior.
  useEffect(() => {
    setMenuOpen(false);
    setConfirmDelete(false);
    setErr("");
    setDraft("");
  }, [activeId]);

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setErr("");
    try {
      await send.mutateAsync({ waId: activeId, body: draft.trim() });
      setDraft("");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo enviar el mensaje.");
    }
  }

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Conversaciones del WhatsApp del negocio."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configurar IA
            </button>
            <button
              onClick={() => toggleGlobalAi.mutate()}
              disabled={toggleGlobalAi.isPending}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                aiEnabled
                  ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-line bg-stone-bg text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <Power className="h-4 w-4" />
              {toggleGlobalAi.isPending ? "Cambiando…" : aiEnabled ? "IA activada" : "IA desactivada"}
            </button>
          </div>
        }
      />

      {!aiEnabled && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Power className="h-4 w-4 shrink-0" />
          La IA está <strong>desactivada para todo el negocio</strong>: no responde a ningún cliente. Los mensajes que lleguen se guardan igual en la bandeja, para que respondas vos. Activala con el botón de arriba cuando esté lista.
        </div>
      )}

      <div className="flex h-[calc(100vh-220px)] min-h-[460px] overflow-hidden rounded-2xl border border-line bg-white">
        {/* ─── Lista de conversaciones ─── */}
        <aside className="flex w-full max-w-[320px] shrink-0 flex-col border-r border-line">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              {showArchived ? "Archivados" : "Chats"}
              {conversations.length > 0 && <span className="text-muted"> ({conversations.length})</span>}
            </span>
            <button
              onClick={() => { setShowArchived((v) => !v); setActiveId(null); }}
              className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-brand hover:text-brand"
            >
              {showArchived ? <><MessageCircle className="h-3 w-3" /> Ver activos</> : <><Archive className="h-3 w-3" /> Archivados</>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid place-items-center py-10"><Spinner className="text-brand" /></div>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                {showArchived
                  ? "No hay conversaciones archivadas."
                  : "Todavía no hay conversaciones. Cuando un cliente escriba al WhatsApp, aparece acá."}
              </p>
            ) : (
              conversations.map((c) => (
                <ConversationRow
                  key={c.waId}
                  convo={c}
                  active={c.waId === activeId}
                  onClick={() => setActiveId(c.waId)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ─── Hilo de conversación ─── */}
        <section className="flex min-w-0 flex-1 flex-col bg-[#f4f1ea]">
          {!active ? (
            <div className="grid flex-1 place-items-center text-center">
              <div className="text-muted">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-line" />
                <p className="text-sm">Elegí una conversación para verla.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={active.name} waId={active.waId} size="h-9 w-9 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{active.name || active.waId}</p>
                    <p className="text-[11px] text-muted">+{active.waId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAi.mutate(active.waId)}
                    disabled={toggleAi.isPending}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active.aiPaused
                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                    title={active.aiPaused ? "La IA está pausada en este chat. Clic para reactivarla." : "La IA responde sola. Clic para pausarla."}
                  >
                    {active.aiPaused ? <><Play className="h-3.5 w-3.5" /> IA pausada</> : <><Bot className="h-3.5 w-3.5" /> IA activa</>}
                  </button>

                  {/* Menú: archivar / eliminar */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-stone-bg hover:text-ink"
                      aria-label="Más opciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                          <button
                            onClick={handleArchive}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-stone-bg"
                          >
                            {active.archived
                              ? <><ArchiveRestore className="h-4 w-4 text-muted" /> Desarchivar</>
                              : <><Archive className="h-4 w-4 text-muted" /> Archivar chat</>}
                          </button>
                          <button
                            onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar chat
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted">Sin mensajes.</p>
                ) : (
                  messages.map((m, i) => (
                    <Bubble key={m.id} msg={m} prev={messages[i - 1]} />
                  ))
                )}
              </div>

              {/* Aviso IA pausada */}
              {active.aiPaused && (
                <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] text-amber-700">
                  <Pause className="mr-1 inline h-3 w-3" />
                  La IA está pausada en este chat — las respuestas las das vos. Reactivala con el botón de arriba cuando termines.
                </div>
              )}

              {/* Caja de respuesta */}
              <div className="border-t border-line bg-white px-3 py-3">
                {err && <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{err}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    rows={1}
                    placeholder="Escribí una respuesta… (se envía como vendedor y pausa la IA)"
                    className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                  />
                  <button
                    onClick={handleSend}
                    disabled={send.isPending || !draft.trim()}
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:opacity-90 disabled:opacity-40"
                    aria-label="Enviar"
                  >
                    {send.isPending ? <Spinner className="text-white" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Confirmación de eliminar */}
      {confirmDelete && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-ink">Eliminar conversación</h3>
            <p className="mt-2 text-sm text-body">
              Se va a borrar la conversación con <strong>{active.name || `+${active.waId}`}</strong> y todos sus mensajes. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-line px-4 py-2 text-sm text-ink hover:bg-stone-bg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConvo.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleteConvo.isPending ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configurar la IA — aprendizajes */}
      {configOpen && <AiLessonsModal onClose={() => setConfigOpen(false)} />}
    </>
  );
}

/**
 * Gestor de "aprendizajes" de la IA: cada uno es una instrucción individual
 * que se puede agregar, editar o eliminar. Aplican a la IA de WhatsApp Y a la
 * del chat de la tienda.
 */
function AiLessonsModal({ onClose }: { onClose: () => void }) {
  const { data: lessons = [], isLoading } = useAiLessons();
  const createLesson = useCreateAiLesson();
  const updateLesson = useUpdateAiLesson();
  const deleteLesson = useDeleteAiLesson();

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    await createLesson.mutateAsync(text);
    setDraft("");
  }

  async function handleSaveEdit(id: number) {
    const text = editText.trim();
    if (!text) return;
    await updateLesson.mutateAsync({ id, content: text });
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-6 pb-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
              <GraduationCap className="h-4 w-4 text-brand" /> Aprendizajes de la IA
            </h3>
            <p className="mt-1 text-xs text-body">
              Cada aprendizaje es una instrucción que la IA sigue con prioridad. Sirve para casos que no están en el catálogo (trabajos a medida, presupuestos, arreglos, promos…). Aplican al chat de WhatsApp y al de la tienda.
            </p>
          </div>
          <button onClick={onClose} className="mt-0.5 shrink-0 text-muted hover:text-ink" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Agregar nuevo */}
        <div className="border-b border-line p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink">Nuevo aprendizaje</span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Ej: Si preguntan cuánto sale hacer una cadena de plata a medida, no digas que no la tenemos: decí que se puede encargar y que un vendedor los contacta con el precio."
              className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={createLesson.isPending || !draft.trim()}
              className="btn-brand flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50"
            >
              {createLesson.isPending ? <Spinner className="text-white" /> : <><Plus className="h-4 w-4" /> Agregar</>}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid place-items-center py-8"><Spinner className="text-brand" /></div>
          ) : lessons.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Todavía no cargaste aprendizajes. Agregá el primero arriba.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {(lessons as AiLesson[]).map((l) => (
                <li key={l.id} className="rounded-xl border border-line p-3">
                  {editingId === l.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-stone-bg">
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(l.id)}
                          disabled={updateLesson.isPending || !editText.trim()}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : confirmId === l.id ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-red-700">¿Eliminar este aprendizaje?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmId(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-stone-bg">
                          No
                        </button>
                        <button
                          onClick={async () => { await deleteLesson.mutateAsync(l.id); setConfirmId(null); }}
                          disabled={deleteLesson.isPending}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <p className="whitespace-pre-wrap break-words text-sm text-ink">{l.content}</p>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => { setEditingId(l.id); setEditText(l.content); }}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-stone-bg hover:text-brand"
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmId(l.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line p-4 text-right">
          <button onClick={onClose} className="rounded-xl border border-line px-4 py-2 text-sm text-ink hover:bg-stone-bg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({ convo, active, onClick }: { convo: WaConversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-stone-bg ${active ? "bg-stone-bg" : ""}`}
    >
      <Avatar name={convo.name} waId={convo.waId} size="h-10 w-10 text-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-ink">{convo.name || `+${convo.waId}`}</p>
          <span className="shrink-0 text-[10px] text-muted">{fmtTime(convo.lastAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted">{convo.lastMessage || "—"}</p>
          {convo.unread > 0 && (
            <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-green-500 px-1 text-[10px] font-semibold text-white">
              {convo.unread}
            </span>
          )}
        </div>
        {convo.aiPaused && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-600">
            <Pause className="h-2.5 w-2.5" /> IA pausada
          </span>
        )}
      </div>
    </button>
  );
}

function Bubble({ msg, prev }: { msg: WaMessage; prev?: WaMessage }) {
  const mine = msg.direction === "out";
  const showDay = !prev || fmtDay(prev.at) !== fmtDay(msg.at);

  return (
    <>
      {showDay && (
        <div className="my-3 flex justify-center">
          <span className="rounded-full bg-white/70 px-3 py-0.5 text-[10px] text-muted shadow-sm">{fmtDay(msg.at)}</span>
        </div>
      )}
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
            mine
              ? msg.sender === "ai"
                ? "rounded-br-sm bg-brand-50 text-ink"
                : "rounded-br-sm bg-green-100 text-ink"
              : "rounded-bl-sm bg-white text-ink"
          }`}
        >
          {mine && (
            <span className={`mb-0.5 flex items-center gap-1 text-[10px] font-medium ${msg.sender === "ai" ? "text-brand" : "text-green-700"}`}>
              {msg.sender === "ai" ? <><Bot className="h-2.5 w-2.5" /> Asistente IA</> : <><User className="h-2.5 w-2.5" /> Vendedor</>}
            </span>
          )}
          <p className="whitespace-pre-wrap break-words leading-snug">{msg.body || "—"}</p>
          <span className="mt-0.5 flex items-center justify-end gap-0.5 text-[9px] text-muted">
            {fmtTime(msg.at)} {mine && <Check className="h-2.5 w-2.5" />}
          </span>
        </div>
      </div>
    </>
  );
}

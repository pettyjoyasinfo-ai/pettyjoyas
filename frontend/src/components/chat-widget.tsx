"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { SITE } from "@/lib/site";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES = [
  "¿Hacen envíos a todo el país?",
  "¿Qué medios de pago aceptan?",
  "¿Tienen anillos de plata?",
  "¿Cómo veo el estado de mi pedido?",
];

const GREETING: ChatMessage = {
  role: "assistant",
  content: "¡Hola! 👋 Soy el asistente de Petty Joyas 💎 Puedo ayudarte con productos, envíos, pagos y el estado de tus pedidos. ¿Qué necesitás?",
};

/**
 * Chat flotante con IA (Grok). Conversa con el backend en /api/chat, que
 * responde con datos reales del catálogo y — si el cliente está logueado —
 * de sus pedidos. Si el backend está en modo mock/sin key, cae a WhatsApp.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;

    const next = [...messages, { role: "user" as const, content: clean }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      // Solo mandamos user/assistant (sin el saludo inicial, que es puro UI).
      const history = next
        .filter((m) => m !== GREETING)
        .map((m) => ({ role: m.role, content: m.content }));

      const { reply } = await apiFetch<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Uy, no pude responderte ahora. Escribinos por WhatsApp y te ayudamos al toque 💛",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const showQuickReplies = messages.length === 1 && !sending;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-24 right-5 z-40 flex h-[520px] max-h-[calc(100vh-8rem)] w-[350px] max-w-[calc(100vw-2.5rem)] origin-bottom-right flex-col rounded-2xl border border-line bg-white shadow-2xl transition-all duration-300",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-ink px-5 py-4 text-white">
          <div>
            <p className="text-sm font-semibold">Asistente Petty Joyas</p>
            <p className="text-xs text-white/60">Respondemos al instante 💎</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Cerrar chat">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "self-end rounded-br-sm bg-brand text-white"
                  : "self-start rounded-tl-sm bg-stone-bg text-body",
              )}
            >
              {m.content}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-tl-sm bg-stone-bg px-4 py-3 text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">Escribiendo…</span>
            </div>
          )}

          {showQuickReplies && (
            <div className="mt-1 flex flex-col gap-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-line px-4 py-2 text-left text-sm text-ink transition hover:border-brand hover:text-brand"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); void send(input); }}
          className="flex items-center gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu consulta…"
            disabled={sending}
            className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Enviar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-800 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Fallback a WhatsApp */}
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="border-t border-line py-2.5 text-center text-xs text-muted transition hover:text-brand"
        >
          ¿Preferís hablar con una persona? Escribinos por WhatsApp
        </a>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chat"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-xl transition hover:bg-brand-800"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}

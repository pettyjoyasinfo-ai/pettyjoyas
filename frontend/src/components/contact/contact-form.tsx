"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: en producción → POST a la API de Laravel (/contact).
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-khaki-100 px-6 py-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-600">
          <Check className="h-7 w-7" />
        </span>
        <h3 className="font-display text-2xl text-ink">¡Mensaje enviado!</h3>
        <p className="text-sm text-body">Te responderemos a la brevedad. ¡Gracias!</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Nombre *"
          className="rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder="Email *"
          className="rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
        />
      </div>
      <input
        placeholder="Asunto (opcional)"
        className="rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
      />
      <textarea
        required
        rows={5}
        placeholder="Tu mensaje *"
        className="rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
      />
      <button type="submit" className="btn-brand self-start">
        <Send className="h-4 w-4" /> Enviar mensaje
      </button>
    </form>
  );
}

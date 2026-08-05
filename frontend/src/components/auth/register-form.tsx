"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRegister } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/store";
import { AuthDivider } from "@/components/auth/auth-card";
import { GoogleSignin } from "@/components/auth/google-signin";
import { Spinner } from "@/components/ui/spinner";

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [form, setForm] = useState({ name: "", lastName: "", email: "", password: "", birthday: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user, token } = await apiRegister({
        name: `${form.name} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        birthday: form.birthday || undefined,
      });
      setAuth(user, token);
      router.push("/mi-cuenta");
      router.refresh();
    } catch {
      setError("No pudimos crear la cuenta. ¿Ese email ya existe?");
      setLoading(false);
    }
  }

  const input = "rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand";

  return (
    <div className="flex flex-col gap-4">
      <GoogleSignin />
      <AuthDivider />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Nombre *" value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
          <input placeholder="Apellido (opcional)" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={input} />
        </div>
        <input type="email" required placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} className={input} />
        <p className="-mt-2 text-xs text-muted">
          Si compraste antes como invitado con este email, ese pedido va a quedar vinculado solo a tu cuenta.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Fecha de nacimiento <span className="text-muted">(opcional)</span></span>
          <input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} className={input} />
        </label>
        <input type="password" required placeholder="Contraseña (mínimo 8) *" value={form.password} onChange={(e) => set("password", e.target.value)} className={input} />
        {error && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-brand w-full">
          {loading ? <Spinner /> : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}

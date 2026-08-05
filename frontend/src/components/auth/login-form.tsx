"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiLogin } from "@/lib/api/auth";
import { useAuth, useAdminAuth } from "@/lib/auth/store";
import { AuthDivider, AuthField } from "@/components/auth/auth-card";
import { GoogleSignin } from "@/components/auth/google-signin";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;
  const setAuth = useAuth((s) => s.setAuth);
  const setAdminAuth = useAdminAuth((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user, token } = await apiLogin(email, password);
      if (user.isStaff) {
        setAdminAuth(user, token);
      } else {
        setAuth(user, token);
      }
      router.push(next ?? (user.isStaff ? "/admin" : "/mi-cuenta"));
      router.refresh();
    } catch {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleSignin redirectTo={next} />
      <AuthDivider />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand"
          />
        </label>
        <div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <div className="mt-2 text-right">
            <Link href="/cuenta/recuperar" className="text-xs text-muted transition hover:text-brand">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        {error && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-brand w-full">
          {loading ? <Spinner /> : "Ingresar"}
        </button>
      </form>
      <p className="text-center text-xs text-muted">
        Si compraste antes como invitado con este email, ese pedido se vincula solo a tu cuenta al ingresar.
      </p>
    </div>
  );
}

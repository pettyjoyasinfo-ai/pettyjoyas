"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AuthCard } from "@/components/auth/auth-card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/store";
import { apiAcceptInvitation, apiResendInvitation } from "@/lib/api/auth";

export default function BienvenidaPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const setAuth      = useAuth((s) => s.setAuth);

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [resent,   setResent]     = useState(false);
  const [resendErr, setResendErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr]   = useState<string | null>(null);

  const accept = useMutation({
    mutationFn: () =>
      apiAcceptInvitation({ token, email, password, password_confirmation: confirm }),
    onSuccess: ({ user, token: authToken }) => {
      setAuth(user, authToken);
      router.push("/mi-cuenta");
    },
  });

  const resend = useMutation({
    mutationFn: () => apiResendInvitation(email),
    onSuccess: () => {
      setResent(true);
      setResendErr(null);
    },
    onError: () => {
      setResendErr("No se pudo reenviar el link. Intentá de nuevo.");
    },
  });

  const isExpiredError =
    accept.isError &&
    (accept.error as any)?.message?.toLowerCase().includes("expir");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErr(null);
    if (password.length < 8) {
      setFieldErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setFieldErr("Las contraseñas no coinciden.");
      return;
    }
    accept.mutate();
  }

  if (!token || !email) {
    return (
      <AuthCard title="Link inválido" subtitle="Este link de invitación no es válido o ya fue utilizado.">
        <p className="text-center text-sm text-muted">
          Si necesitás acceso, pedile al local que te reenvíe la invitación.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Bienvenida a Petty Joyas 🤍"
      subtitle={`Creá tu contraseña para ${email}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            autoFocus
            className="rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Repetir contraseña</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Igual a la anterior"
            required
            className="rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand"
          />
        </label>

        {fieldErr && <p className="text-xs text-red-600">{fieldErr}</p>}

        {accept.isError && !isExpiredError && (
          <p className="text-xs text-red-600">
            {(accept.error as any)?.message ?? "Ocurrió un error. Intentá de nuevo."}
          </p>
        )}

        <button
          type="submit"
          disabled={accept.isPending}
          className="btn-brand flex items-center justify-center gap-2 py-3 text-sm"
        >
          {accept.isPending ? <Spinner /> : "Crear cuenta"}
        </button>
      </form>

      {isExpiredError && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="mb-3 text-sm font-medium text-amber-800">
            Este link ya expiró (válido 7 días).
          </p>
          {resent ? (
            <p className="text-sm text-green-700">
              ✓ Te enviamos un nuevo link. Revisá tu correo.
            </p>
          ) : (
            <>
              <button
                onClick={() => resend.mutate()}
                disabled={resend.isPending}
                className="btn-outline px-5 py-2 text-xs"
              >
                {resend.isPending ? <Spinner className="h-3.5 w-3.5" /> : "Solicitar nuevo link"}
              </button>
              {resendErr && <p className="mt-2 text-xs text-red-600">{resendErr}</p>}
            </>
          )}
        </div>
      )}
    </AuthCard>
  );
}

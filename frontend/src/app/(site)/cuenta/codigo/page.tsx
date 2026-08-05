import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Código de confirmación" };

export default function CodigoPage() {
  return (
    <AuthCard
      title="Revisá tu correo"
      subtitle="Te enviamos un código de 6 dígitos a tu@email.com. Ingresalo para continuar."
      footer={
        <>
          ¿No te llegó? <AuthLink href="#">Reenviar código</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-6">
        <div className="flex justify-center gap-2.5">
          {[8, 3, 5, "", "", ""].map((digit, i) => (
            <input
              key={i}
              maxLength={1}
              defaultValue={digit}
              inputMode="numeric"
              className="h-14 w-12 rounded-xl border border-line text-center text-xl font-semibold text-ink outline-none transition focus:border-brand"
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted">
          El código vence en <span className="font-semibold text-ink">09:42</span>
        </p>
        <Link href="/cuenta/restablecer" className="btn-brand w-full">
          Confirmar código
        </Link>
      </form>
    </AuthCard>
  );
}

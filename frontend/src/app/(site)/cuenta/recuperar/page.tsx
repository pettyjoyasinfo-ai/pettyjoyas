import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthField, AuthLink } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <AuthCard
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresá tu email y te enviaremos un código para restablecerla."
      footer={
        <>
          ¿La recordaste? <AuthLink href="/cuenta">Volver a iniciar sesión</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-4">
        <AuthField label="Email" type="email" placeholder="tu@email.com" />
        <Link href="/cuenta/codigo" className="btn-brand w-full">
          Enviar código
        </Link>
      </form>
    </AuthCard>
  );
}

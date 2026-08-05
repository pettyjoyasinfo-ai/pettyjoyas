import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Hola de nuevo"
      subtitle="Ingresá a tu cuenta para ver tus pedidos y favoritos."
      footer={
        <>
          ¿No tenés cuenta? <AuthLink href="/cuenta/registro">Creala gratis</AuthLink>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

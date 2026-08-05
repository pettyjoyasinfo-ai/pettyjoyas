import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <AuthCard
      title="Creá tu cuenta"
      subtitle="Sumate y obtené 10% off en tu primera compra."
      footer={
        <>
          ¿Ya tenés cuenta? <AuthLink href="/cuenta">Iniciá sesión</AuthLink>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

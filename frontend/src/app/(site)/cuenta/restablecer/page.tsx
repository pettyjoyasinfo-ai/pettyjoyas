import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthCard, AuthField } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default function RestablecerPage() {
  return (
    <AuthCard
      title="Nueva contraseña"
      subtitle="Elegí una contraseña nueva para tu cuenta."
    >
      <form className="flex flex-col gap-4">
        <AuthField label="Nueva contraseña" type="password" placeholder="Mínimo 8 caracteres" />
        <AuthField label="Repetir contraseña" type="password" placeholder="••••••••" />
        <ul className="rounded-xl bg-stone-bg px-4 py-3 text-xs text-body">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Al menos 8 caracteres
          </li>
          <li className="mt-1.5 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Una mayúscula y un número
          </li>
        </ul>
        <Link href="/cuenta" className="btn-brand w-full">
          Guardar y volver a ingresar
        </Link>
      </form>
    </AuthCard>
  );
}

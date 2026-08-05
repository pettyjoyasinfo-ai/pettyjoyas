"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { useAdminAuth } from "@/lib/auth/store";
import { useUpdateStaffProfile } from "@/lib/api/admin";

export default function AdminProfilePage() {
  const { user, setUser } = useAdminAuth();
  const update = useUpdateStaffProfile();

  // Datos personales
  const [name,  setName]  = useState(user?.name  ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dataSaved, setDataSaved] = useState(false);

  // Contraseña
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [pwdSaved,    setPwdSaved]    = useState(false);
  const [pwdError,    setPwdError]    = useState("");

  async function handleSaveData(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await update.mutateAsync({ name, email, phone: phone || undefined });
      setUser(updated);
      setDataSaved(true);
      setTimeout(() => setDataSaved(false), 3000);
    } catch {}
  }

  async function handleSavePwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    if (newPwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }
    try {
      const updated = await update.mutateAsync({
        current_password:      currentPwd,
        password:              newPwd,
        password_confirmation: confirmPwd,
      });
      // Importante: refresca el user del store — si tenía mustChangePassword,
      // acá se limpia y el guard de admin-shell deja de redirigir para acá.
      setUser(updated);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err: any) {
      setPwdError(err?.details?.message ?? "Contraseña actual incorrecta o error inesperado.");
    }
  }

  return (
    <>
      <PageHeader title="Mi perfil" description="Editá tus datos y contraseña de acceso al panel." />

      {user?.mustChangePassword && (
        <div className="mb-5 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-medium text-amber-800">Tenés que cambiar tu contraseña</p>
            <p className="text-xs text-amber-700">
              Entraste con una contraseña provisoria. Elegí una nueva acá abajo para poder usar el resto del panel.
            </p>
          </div>
        </div>
      )}

      <div className="flex max-w-xl flex-col gap-5">
        {/* Datos personales */}
        <form onSubmit={handleSaveData} className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-ink">Datos personales</h2>

          <div className="flex flex-col gap-4">
            <FormField label="Nombre" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </FormField>
            <FormField label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </FormField>
            <FormField label="Teléfono" optional>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </FormField>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={update.isPending}
              className="btn-brand disabled:opacity-50"
            >
              {update.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
            {dataSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
            {update.isError && !pwdError && (
              <span className="text-sm text-red-600">
                {(update.error as any)?.details?.message ?? "Error al guardar."}
              </span>
            )}
          </div>
        </form>

        {/* Cambio de contraseña */}
        <form onSubmit={handleSavePwd} className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-ink">Cambiar contraseña</h2>

          <div className="flex flex-col gap-4">
            <FormField label="Contraseña actual" required>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </FormField>
            <FormField label="Nueva contraseña" required>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
              <p className="mt-1 text-xs text-muted">Mínimo 8 caracteres.</p>
            </FormField>
            <FormField label="Confirmar contraseña" required>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                autoComplete="new-password"
                className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </FormField>

            {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={update.isPending || !currentPwd || !newPwd || !confirmPwd}
              className="btn-brand disabled:opacity-50"
            >
              {update.isPending ? "Guardando…" : "Cambiar contraseña"}
            </button>
            {pwdSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Contraseña actualizada
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

function FormField({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-body">
        {label}{" "}
        {required && <span className="text-brand">*</span>}
        {optional && <span className="text-xs text-muted">(opcional)</span>}
      </span>
      {children}
    </label>
  );
}

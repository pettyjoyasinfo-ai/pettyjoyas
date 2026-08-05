"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { useUpdateProfile } from "@/lib/api/account";
import { Spinner } from "@/components/ui/spinner";

const inp = "rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand w-full";

export default function DatosPage() {
  const user       = useAuth((s) => s.user);
  const updateData = useUpdateProfile();
  const updatePwd  = useUpdateProfile();

  const [form, setForm]   = useState({ name: "", phone: "", birthday: "" });
  const [dataSaved, setDataSaved] = useState(false);

  const [pwdForm, setPwdForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [pwdSaved, setPwdSaved]   = useState(false);
  const [pwdError, setPwdError]   = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name:     user.name     ?? "",
        phone:    user.phone    ?? "",
        birthday: user.birthday ?? "",
      });
    }
  }, [user]);

  async function saveData(e: React.FormEvent) {
    e.preventDefault();
    setDataSaved(false);
    await updateData.mutateAsync({ name: form.name, phone: form.phone || null, birthday: form.birthday || null });
    setDataSaved(true);
    setTimeout(() => setDataSaved(false), 3000);
  }

  async function savePwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    if (pwdForm.password !== pwdForm.password_confirmation) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }
    try {
      await updatePwd.mutateAsync(pwdForm);
      setPwdForm({ current_password: "", password: "", password_confirmation: "" });
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err: any) {
      setPwdError(err?.details?.message ?? "Contraseña actual incorrecta.");
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Mis datos</h1>
        <p className="mt-1 text-sm text-body">Editá tu perfil y preferencias.</p>
      </div>

      {/* ─── Datos personales ─── */}
      <form onSubmit={saveData} className="rounded-2xl border border-line bg-white p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink">Datos personales</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Nombre <span className="text-brand">*</span></span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inp}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Email <span className="text-xs text-muted">(no editable)</span></span>
          <input value={user?.email ?? ""} readOnly className={`${inp} bg-stone-50 text-muted cursor-not-allowed`} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Teléfono / WhatsApp <span className="text-xs text-muted">(opcional)</span></span>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+54 9 11 …"
            className={inp}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Fecha de nacimiento <span className="text-xs text-muted">(opcional)</span></span>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
            className={inp}
          />
        </label>

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" disabled={updateData.isPending} className="btn-brand self-start px-5 py-2.5 text-sm disabled:opacity-50">
            {updateData.isPending ? <Spinner /> : "Guardar cambios"}
          </button>
          {dataSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Guardado
            </span>
          )}
        </div>
      </form>

      {/* ─── Cambio de contraseña ─── */}
      <form onSubmit={savePwd} className="rounded-2xl border border-line bg-white p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink">Cambiar contraseña</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Contraseña actual <span className="text-brand">*</span></span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={pwdForm.current_password}
            onChange={(e) => setPwdForm((f) => ({ ...f, current_password: e.target.value }))}
            className={inp}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Nueva contraseña <span className="text-brand">*</span></span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={pwdForm.password}
            onChange={(e) => setPwdForm((f) => ({ ...f, password: e.target.value }))}
            className={inp}
          />
          <span className="text-xs text-muted">Mínimo 8 caracteres.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-body">Confirmar contraseña <span className="text-brand">*</span></span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={pwdForm.password_confirmation}
            onChange={(e) => setPwdForm((f) => ({ ...f, password_confirmation: e.target.value }))}
            className={inp}
          />
        </label>

        {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={updatePwd.isPending || !pwdForm.current_password || !pwdForm.password}
            className="btn-brand self-start px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {updatePwd.isPending ? <Spinner /> : "Cambiar contraseña"}
          </button>
          {pwdSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Contraseña actualizada
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

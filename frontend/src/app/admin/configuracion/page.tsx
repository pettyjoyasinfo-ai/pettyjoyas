"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, CreditCard, Landmark, Plus, Truck, Users, X,
} from "lucide-react";
import { Badge, Card, CardGrid, PageHeader } from "@/components/admin/ui";
import {
  useSettings,
  useUpdateSettings,
  useAdminStaffUsers,
  useCreateStaffUser,
  useUpdateStaffUser,
  type StaffUser,
} from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/auth/store";
import { ADMIN_MODULES } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

const INPUT = "w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand";
const ROLE_LABEL: Record<string, string> = { admin: "Administrador/a", vendedor: "Vendedor/a" };

// ─── Toggle controlado ───────────────────────────────────────────────────────
function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-block shrink-0 rounded-full transition-colors",
        on ? "bg-green-500" : "bg-khaki-200",
      )}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all"
        style={{ left: on ? 22 : 3 }}
      />
    </button>
  );
}

function Saved({ ok, err }: { ok: boolean; err?: string }) {
  if (err) return <span className="text-xs text-red-600">{err}</span>;
  if (ok)  return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Guardado</span>;
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminConfig() {
  const { user: me } = useAdminAuth();
  const { data: settings }   = useSettings();
  const updateSettings       = useUpdateSettings();
  const { data: staffUsers, isLoading: loadingUsers } = useAdminStaffUsers();
  const createUser           = useCreateStaffUser();
  const updateUser           = useUpdateStaffUser();

  /* ── Pagos ── */
  const [mpEnabled,   setMpEnabled]   = useState(true);
  const [trfEnabled,  setTrfEnabled]  = useState(true);
  const [descuentoTrf, setDescuentoTrf] = useState(10);
  const [paySaved,    setPaySaved]    = useState(false);

  /* ── Envíos ── */
  const [domEnabled,  setDomEnabled]  = useState(true);
  const [retEnabled,  setRetEnabled]  = useState(true);
  const [costoEnvio,  setCostoEnvio]  = useState(6500);
  const [gratisDesdePesos, setGratisDesdePesos] = useState(80000);
  const [retDireccion, setRetDireccion] = useState<string>(SITE.address);
  const [shipSaved,   setShipSaved]   = useState(false);

  /* Sync desde API cuando cargan los settings */
  useEffect(() => {
    if (!settings) return;
    if (settings.payment) {
      const p = settings.payment as any;
      setMpEnabled(p.mercadopago_enabled ?? true);
      setTrfEnabled(p.transferencia_enabled ?? true);
      setDescuentoTrf(p.descuento_transferencia ?? 10);
    }
    if (settings.shipping) {
      const s = settings.shipping as any;
      setDomEnabled(s.domicilio_enabled ?? true);
      setRetEnabled(s.retiro_enabled ?? true);
      setCostoEnvio(Math.round((s.costo_estandar ?? 650000) / 100));
      setGratisDesdePesos(Math.round((s.gratis_desde ?? 8000000) / 100));
      setRetDireccion(s.retiro_direccion ?? SITE.address);
    }
  }, [settings]);

  async function savePayment() {
    await updateSettings.mutateAsync({
      payment: {
        mercadopago_enabled: mpEnabled,
        transferencia_enabled: trfEnabled,
        descuento_transferencia: descuentoTrf,
      },
    });
    setPaySaved(true);
    setTimeout(() => setPaySaved(false), 3000);
  }

  async function saveShipping() {
    await updateSettings.mutateAsync({
      shipping: {
        domicilio_enabled: domEnabled,
        retiro_enabled: retEnabled,
        costo_estandar: costoEnvio * 100,
        gratis_desde: gratisDesdePesos * 100,
        retiro_direccion: retDireccion,
      },
    });
    setShipSaved(true);
    setTimeout(() => setShipSaved(false), 3000);
  }

  /* ── Modales ── */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser,   setEditUser]   = useState<StaffUser | null>(null);
  const isAdmin = me?.role === "admin";

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Métodos de pago, opciones de envío y usuarios con roles y permisos."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* ── Métodos de pago ── */}
        <Card
          title="Métodos de pago"
          action={
            <div className="flex items-center gap-2">
              <Saved ok={paySaved} />
              <button onClick={savePayment} disabled={updateSettings.isPending} className="btn-brand px-3 py-1.5 text-xs disabled:opacity-50">
                Guardar
              </button>
            </div>
          }
        >
          <ul className="flex flex-col gap-4">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">MercadoPago</span>
                  <span className="text-xs text-muted">Tarjetas, débito y QR presencial</span>
                </span>
              </span>
              <ToggleSwitch on={mpEnabled} onChange={setMpEnabled} />
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-600">
                  <Landmark className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">Transferencia bancaria</span>
                  <span className="text-xs text-muted">CBU/Alias · {descuentoTrf}% de descuento</span>
                </span>
              </span>
              <ToggleSwitch on={trfEnabled} onChange={setTrfEnabled} />
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Descuento transferencia (%)</span>
              <input
                type="number" min={0} max={100} value={descuentoTrf}
                onChange={(e) => setDescuentoTrf(+e.target.value)}
                className={INPUT}
              />
            </label>
          </div>
        </Card>

        {/* ── Envíos ── */}
        <Card
          title="Opciones de envío"
          action={
            <div className="flex items-center gap-2">
              <Saved ok={shipSaved} />
              <button onClick={saveShipping} disabled={updateSettings.isPending} className="btn-brand px-3 py-1.5 text-xs disabled:opacity-50">
                Guardar
              </button>
            </div>
          }
        >
          <ul className="flex flex-col gap-4">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-khaki-100 text-gold-700">
                  <Truck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">Envío a domicilio</span>
                  <span className="text-xs text-muted">Correo Argentino / Andreani</span>
                </span>
              </span>
              <ToggleSwitch on={domEnabled} onChange={setDomEnabled} />
            </li>
            <li className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-khaki-100 text-gold-700">
                    <Truck className="h-5 w-5" />
                  </span>
                  <span className="block font-medium text-ink">Retiro en el local</span>
                </span>
                <ToggleSwitch on={retEnabled} onChange={setRetEnabled} />
              </div>
              {retEnabled && (
                <input
                  value={retDireccion}
                  onChange={(e) => setRetDireccion(e.target.value)}
                  placeholder="Dirección del local"
                  className="ml-[52px] rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-brand"
                />
              )}
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Costo estándar ($)</span>
              <input
                type="number" min={0} value={costoEnvio}
                onChange={(e) => setCostoEnvio(+e.target.value)}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Envío gratis desde ($)</span>
              <input
                type="number" min={0} value={gratisDesdePesos}
                onChange={(e) => setGratisDesdePesos(+e.target.value)}
                className={INPUT}
              />
            </label>
          </div>
        </Card>
      </div>

      {/* ── Usuarios y roles ── */}
      <div className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Usuarios y roles</h2>
          {isAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Invitar usuario
            </button>
          )}
        </div>

        {loadingUsers ? (
          <p className="text-sm text-muted">Cargando usuarios…</p>
        ) : (
          <CardGrid>
            {(staffUsers ?? []).map((u) => (
              <UserCard key={u.id} user={u} isAdmin={isAdmin} onEdit={() => setEditUser(u)} />
            ))}
          </CardGrid>
        )}
      </div>

      {inviteOpen && (
        <InviteModal
          onClose={() => { setInviteOpen(false); createUser.reset(); }}
          onCreate={async (data) => { await createUser.mutateAsync(data); setInviteOpen(false); }}
          isPending={createUser.isPending}
          error={(createUser.error as any)?.details?.message}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => { setEditUser(null); updateUser.reset(); }}
          onSave={async (data) => { await updateUser.mutateAsync({ id: editUser.id, body: data }); setEditUser(null); }}
          isPending={updateUser.isPending}
          error={(updateUser.error as any)?.details?.message}
        />
      )}
    </>
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({ user, isAdmin, onEdit }: { user: StaffUser; isAdmin: boolean; onEdit: () => void }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-khaki-100 text-sm font-semibold text-gold-700">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
        <div className="flex flex-wrap gap-1.5">
          <Badge className={user.role === "admin" ? "bg-brand-50 text-brand-700" : "bg-blue-50 text-blue-700"}>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ROLE_LABEL[user.role] ?? user.role}</span>
          </Badge>
          <Badge className={user.active ? "bg-green-50 text-green-700" : "bg-stone-bg text-muted"}>
            {user.active ? "activo" : "suspendido"}
          </Badge>
        </div>
        {isAdmin && (
          <button onClick={onEdit} className="shrink-0 text-xs font-medium text-brand hover:underline">
            Editar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared modal wrapper ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function MField({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
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

// ─── Selector de módulos (solo aplica a rol vendedor) ─────────────────────────
function ModulePermissionsPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  }
  return (
    <div>
      <span className="text-sm text-body">Módulos habilitados</span>
      <p className="mb-2 mt-0.5 text-xs text-muted">Qué secciones del panel puede ver esta persona.</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-line p-3">
        {ADMIN_MODULES.map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={value.includes(m.key)}
              onChange={() => toggle(m.key)}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            {m.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── InviteModal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onCreate, isPending, error }: {
  onClose: () => void;
  onCreate: (d: { name: string; email: string; role: string; phone?: string; password: string; permissions?: string[] }) => Promise<void>;
  isPending: boolean;
  error?: string;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState("vendedor");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  return (
    <Modal title="Invitar usuario" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onCreate({ name, email, role, phone: phone || undefined, password, ...(role === "vendedor" ? { permissions } : {}) });
        }}
        className="flex flex-col gap-4"
      >
        <MField label="Nombre" required>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT} />
        </MField>
        <MField label="Email" required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} />
        </MField>
        <MField label="Rol" required>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
            <option value="vendedor">Vendedor/a</option>
            <option value="admin">Administrador/a</option>
          </select>
        </MField>
        {role === "vendedor" && (
          <ModulePermissionsPicker value={permissions} onChange={setPermissions} />
        )}
        <MField label="Teléfono" optional>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
        </MField>
        <MField label="Contraseña inicial" required>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={INPUT} />
          <p className="mt-1 text-xs text-muted">Compartila con la persona invitada. Puede cambiarla desde Mi perfil.</p>
        </MField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
          <button type="submit" disabled={isPending} className="btn-brand disabled:opacity-50">
            {isPending ? "Creando…" : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditUserModal ────────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave, isPending, error }: {
  user: StaffUser;
  onClose: () => void;
  onSave: (d: any) => Promise<void>;
  isPending: boolean;
  error?: string;
}) {
  const [name,     setName]     = useState(user.name);
  const [email,    setEmail]    = useState(user.email);
  const [role,     setRole]     = useState<string>(user.role);
  const [active,   setActive]   = useState(user.active);
  const [phone,    setPhone]    = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>(user.permissions ?? []);

  return (
    <Modal title={`Editar — ${user.name}`} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            name, email, role, active, phone: phone || undefined,
            ...(password ? { password } : {}),
            permissions: role === "vendedor" ? permissions : null,
          });
        }}
        className="flex flex-col gap-4"
      >
        <MField label="Nombre" required>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT} />
        </MField>
        <MField label="Email" required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} />
        </MField>
        <MField label="Rol" required>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
            <option value="vendedor">Vendedor/a</option>
            <option value="admin">Administrador/a</option>
          </select>
        </MField>
        {role === "vendedor" && (
          <ModulePermissionsPicker value={permissions} onChange={setPermissions} />
        )}
        <MField label="Teléfono" optional>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
        </MField>
        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Estado</p>
            <p className="text-xs text-muted">{active ? "Activa — puede ingresar al panel" : "Suspendida — bloqueada"}</p>
          </div>
          <ToggleSwitch on={active} onChange={setActive} />
        </div>
        <MField label="Nueva contraseña" optional>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={8} placeholder="Dejar vacío para no cambiar"
            className={INPUT}
          />
        </MField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
          <button type="submit" disabled={isPending} className="btn-brand disabled:opacity-50">
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

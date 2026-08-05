"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Cake, Check, Crown, Mail, Phone, RefreshCw, Rss, Send } from "lucide-react";
import { Badge, Card, CardGrid, KV, PageHeader, StatCard } from "@/components/admin/ui";
import { LoadingScreen, Spinner } from "@/components/ui/spinner";
import { useAdminCustomer, useSendCustomerEmail, useUpdateCustomer } from "@/lib/api/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApiFetch, apiFetch } from "@/lib/api/client";
import { apiResendInvitation } from "@/lib/api/auth";
import { SEGMENT_STYLE } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: c, isLoading } = useAdminCustomer(id);
  const update = useUpdateCustomer();
  const sendEmail = useSendCustomerEmail();

  const [subject, setSubject] = useState("¡Novedades de Petty Joyas! 🤍");
  const [message, setMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const toggleNewsletter = useMutation({
    mutationFn: () =>
      c?.newsletterSubscribed && c?.newsletterSubscriberId
        ? adminApiFetch(`/admin/newsletter/${c.newsletterSubscriberId}`, { method: "DELETE" })
        : apiFetch(`/newsletter`, {
            method: "POST",
            body: JSON.stringify({ email: c?.email, name: c?.name }),
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customer", id] });
      qc.invalidateQueries({ queryKey: ["admin", "newsletter"] });
    },
  });

  if (isLoading || !c) return <LoadingScreen label="Cargando cliente…" />;

  const ticket = c.orders ? Math.round(c.spent / c.orders) : 0;
  const hasAccount = !!c.userId;

  async function handleSendEmail() {
    setEmailSent(false);
    setEmailError(null);
    try {
      await sendEmail.mutateAsync({ id, subject, message });
      setEmailSent(true);
      setMessage("");
      setTimeout(() => setEmailSent(false), 4000);
    } catch {
      setEmailError("No se pudo enviar el email. Intentá de nuevo.");
    }
  }

  async function handleResendInvitation() {
    setInviteSent(false);
    setInviteError(null);
    try {
      await apiResendInvitation(c.email);
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 4000);
    } catch {
      setInviteError("No se pudo reenviar la invitación.");
    }
  }

  return (
    <>
      <PageHeader
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email ?? "—"}</span>
            {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>}
            {c.birthday && <span className="flex items-center gap-1.5"><Cake className="h-3.5 w-3.5" /> {c.birthday}</span>}
          </span>
        }
        action={<Link href="/admin/clientes" className="btn-outline px-4 py-2 text-xs">← Volver</Link>}
      />

      <CardGrid className="xl:grid-cols-4">
        <StatCard label="Compras realizadas" value={String(c.orders)} />
        <StatCard label="Total gastado (LTV)" value={formatPrice(c.spent)} />
        <StatCard label="Ticket promedio" value={formatPrice(ticket)} />
        <StatCard label="Segmento" value={c.segment} />
      </CardGrid>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Historial de compras (online + local)</h2>
          {(c.purchases ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">Sin compras registradas.</p>
          ) : (
            <CardGrid className="xl:grid-cols-2">
              {c.purchases.map((o: any) => (
                <div key={o.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{o.number}</span>
                    <Badge className={o.channel === "local" ? "bg-gold-100 text-gold-700" : "bg-blue-50 text-blue-700"}>{o.channel}</Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                    <KV label="Fecha">{new Date(o.createdAt).toLocaleDateString("es-AR")}</KV>
                    <KV label="Items">{o.items?.length ?? 0}</KV>
                    <KV label="Total"><span className="font-semibold">{formatPrice(o.total)}</span></KV>
                  </div>
                </div>
              ))}
            </CardGrid>
          )}
        </div>

        <div className="flex h-fit flex-col gap-5">
          <Card title="Segmento">
            <div className="flex items-center justify-between gap-3">
              <Badge className={SEGMENT_STYLE[c.segment]}>{c.segment}</Badge>
              <span className="text-xs text-muted">{c.vip ? "VIP manual" : "automático"}</span>
            </div>
            <div className="mt-4 rounded-xl bg-gold-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink"><Crown className="h-4 w-4 text-gold-700" /> Marcar como VIP</p>
              <button
                onClick={() => update.mutate({ id, body: { vip: !c.vip, segment: !c.vip ? "vip" : "recurrente" } })}
                disabled={update.isPending}
                className="btn-gold mt-3 w-full py-2 text-xs"
              >
                {c.vip ? "Quitar VIP" : "Asignar VIP"}
              </button>
            </div>
          </Card>

          <Card title="Enviar email individual">
            {!c.email ? (
              <p className="text-xs text-muted">Este cliente no tiene email registrado.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  readOnly
                  value={`Para: ${c.email}`}
                  className="rounded-xl border border-line bg-stone-bg px-3.5 py-2.5 text-sm text-body outline-none"
                />
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto"
                  className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                />
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensaje…"
                  className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={sendEmail.isPending || !subject.trim() || !message.trim()}
                  className="btn-brand flex items-center justify-center gap-1.5 py-2 text-xs disabled:opacity-50"
                >
                  {sendEmail.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  Enviar
                </button>
                {emailSent && (
                  <span className="flex items-center gap-1.5 text-xs text-green-700">
                    <Check className="h-3.5 w-3.5" /> Email enviado correctamente
                  </span>
                )}
                {emailError && <span className="text-xs text-red-600">{emailError}</span>}
              </div>
            )}
          </Card>

          {c.email && !hasAccount && (
            <Card title="Invitación de cuenta">
              <p className="mb-3 text-xs text-muted">
                Este cliente no creó su cuenta todavía. Podés reenviarle el link de invitación.
              </p>
              <button
                onClick={handleResendInvitation}
                disabled={inviteSent}
                className="btn-outline flex w-full items-center justify-center gap-1.5 py-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reenviar invitación
              </button>
              {inviteSent && (
                <span className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
                  <Check className="h-3.5 w-3.5" /> Invitación enviada
                </span>
              )}
              {inviteError && <span className="mt-2 text-xs text-red-600">{inviteError}</span>}
            </Card>
          )}

          <Card title="Notas internas">
            <textarea
              rows={3}
              defaultValue={c.notes ?? ""}
              onBlur={(e) => update.mutate({ id, body: { notes: e.target.value } })}
              placeholder="Preferencias, talle, observaciones…"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Card>

          <Card title="Newsletter">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`grid h-8 w-8 place-items-center rounded-full ${c.newsletterSubscribed ? "bg-green-50" : "bg-stone-100"}`}>
                  <Rss className={`h-4 w-4 ${c.newsletterSubscribed ? "text-green-600" : "text-stone-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {c.newsletterSubscribed ? "Suscripto" : "No suscripto"}
                  </p>
                  <p className="text-xs text-muted">
                    {c.newsletterSubscribed
                      ? "Recibe novedades y descuentos"
                      : "No recibe comunicaciones"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleNewsletter.mutate()}
                disabled={toggleNewsletter.isPending}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  c.newsletterSubscribed
                    ? "border border-line text-body hover:border-red-300 hover:text-red-600"
                    : "bg-brand text-white hover:bg-brand/90"
                }`}
              >
                {c.newsletterSubscribed ? "Desuscribir" : "Suscribir"}
              </button>
            </div>
            {c.newsletterSubscribed && (
              <Link
                href="/admin/newsletter"
                className="mt-3 flex items-center gap-1.5 text-xs text-brand hover:underline"
              >
                <Rss className="h-3.5 w-3.5" /> Ver en newsletter →
              </Link>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

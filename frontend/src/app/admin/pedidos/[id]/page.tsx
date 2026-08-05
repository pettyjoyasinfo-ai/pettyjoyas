"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bell, Check, FileText, MapPin, Send, Truck, X } from "lucide-react";
import { Badge, Card, KV, PageHeader } from "@/components/admin/ui";
import { LoadingScreen } from "@/components/ui/spinner";
import {
  useAdminOrder,
  useUpdateOrderStatus,
  useUpdateOrderNotes,
  useNotifyCustomer,
} from "@/lib/api/admin";
import { ORDER_STATUS_STYLE, ORDER_STATUSES, PAYMENT_METHOD_LABEL } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

// ── Status tracker ──────────────────────────────────────────────────────────
const NORMAL_TRACK = ["pendiente", "pagado", "preparacion", "enviado", "entregado"];
const RESERVA_TRACK = ["reserva", "preparacion", "entregado"];

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pedido recibido",
  reserva: "Reserva",
  pagado: "Pago confirmado",
  preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// ── Comprobante HTML generator ───────────────────────────────────────────────
function fmtARS(n: number): string {
  return "$ " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function buildComprobanteHTML(order: any): string {
  const rows = (order.items ?? [])
    .map(
      (it: any) => `
      <tr>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px">
          ${it.name}${it.variantLabel ? ` <span style="color:#888;font-size:11px">(${it.variantLabel})</span>` : ""}
          <span style="color:#aaa"> ×${it.quantity}</span>
        </td>
        <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${fmtARS(it.unitPrice * it.quantity)}</td>
      </tr>`
    )
    .join("");

  const addr = order.address
    ? [order.address.street, order.address.number, order.address.city, order.address.zip]
        .filter(Boolean)
        .join(", ")
    : null;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante ${order.number}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#333;font-size:14px}
    .header{text-align:center;padding:20px 0 16px;border-bottom:2px solid #821f40;margin-bottom:20px}
    .brand{font-size:22px;font-weight:bold;color:#821f40;letter-spacing:3px}
    .subtitle{font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;margin-top:4px}
    .meta{display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:18px;gap:8px;flex-wrap:wrap}
    .section{margin-bottom:18px}
    .section-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#821f40;margin-bottom:6px;border-bottom:1px solid #f0e0e5;padding-bottom:3px}
    table{width:100%;border-collapse:collapse}
    .total-row td{font-weight:bold;font-size:15px;padding-top:10px;border-top:1px solid #ccc}
    .discount{color:#821f40}
    .footer{margin-top:28px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:14px}
    .btn{display:inline-block;background:#821f40;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:13px;cursor:pointer;margin-bottom:16px;text-decoration:none}
    @media print{.btn{display:none}body{padding:0}}
  </style>
</head>
<body>
  <div style="text-align:right;margin-bottom:12px">
    <button class="btn" onclick="window.print()">🖨 Imprimir</button>
  </div>
  <div class="header">
    <div class="brand">PETTY JOYAS</div>
    <div class="subtitle">Comprobante de pedido</div>
  </div>
  <div class="meta">
    <span><strong>Pedido:</strong> ${order.number}</span>
    <span><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString("es-AR")}</span>
    <span><strong>Estado:</strong> <span style="text-transform:capitalize">${order.status}</span></span>
    <span><strong>Pago:</strong> <span>${PAYMENT_METHOD_LABEL[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—"}</span></span>
  </div>
  ${
    order.customer
      ? `<div class="section">
    <div class="section-title">Cliente</div>
    <div>${order.customer.name}</div>
    <div style="color:#888;font-size:12px">${order.customer.email}</div>
  </div>`
      : ""
  }
  ${
    addr
      ? `<div class="section">
    <div class="section-title">Dirección de envío</div>
    <div>${addr}</div>
  </div>`
      : ""
  }
  <div class="section">
    <div class="section-title">Detalle de productos</div>
    <table>${rows}</table>
  </div>
  <div class="section">
    <table>
      <tr><td style="padding:5px 4px;color:#555">Subtotal</td><td style="text-align:right;padding:5px 4px">${fmtARS(order.subtotal)}</td></tr>
      ${order.discount > 0 ? `<tr class="discount"><td style="padding:5px 4px">Descuento${order.couponCode ? ` (${order.couponCode})` : ""}</td><td style="text-align:right;padding:5px 4px">−${fmtARS(order.discount)}</td></tr>` : ""}
      <tr><td style="padding:5px 4px;color:#555">Envío</td><td style="text-align:right;padding:5px 4px">${order.shippingCost ? fmtARS(order.shippingCost) : "Gratis"}</td></tr>
      <tr class="total-row"><td>Total</td><td style="text-align:right">${fmtARS(order.total)}</td></tr>
    </table>
  </div>
  <div class="footer">
    Gracias por tu compra · pettyjoyas.info@gmail.com
  </div>
</body>
</html>`;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateNotes = useUpdateOrderNotes();
  const notifyCustomer = useNotifyCustomer();

  const [notes, setNotes] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifySent, setNotifySent] = useState(false);

  if (isLoading || !order) return <LoadingScreen label="Cargando pedido…" />;

  const displayNotes = notes ?? (order.notes ?? "");

  const isReservaType = order.paymentMethod === "reserva" || order.status === "reserva";
  const track = isReservaType ? RESERVA_TRACK : NORMAL_TRACK;
  const stepIndex = track.indexOf(order.status);

  const handleSaveNotes = () => {
    updateNotes.mutate({ id, notes: displayNotes });
  };

  const handleSendNotify = () => {
    notifyCustomer.mutate(
      { id, message: notifyMessage },
      {
        onSuccess: () => {
          setNotifySent(true);
          setTimeout(() => {
            setShowNotifyModal(false);
            setNotifySent(false);
            setNotifyMessage("");
          }, 1800);
        },
      }
    );
  };

  const handleComprobante = () => {
    const html = buildComprobanteHTML(order);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <>
      {/* ── Modal: Avisar al cliente ── */}
      {showNotifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNotifyModal(false); }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Avisar al cliente</h3>
              <button onClick={() => setShowNotifyModal(false)} className="text-muted hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              {order.customer
                ? <>Se enviará a <span className="font-medium text-body">{order.customer.email}</span></>
                : "Este pedido no tiene un cliente registrado con email."}
            </p>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Escribí el mensaje para el cliente..."
              rows={4}
              disabled={!order.customer}
              className="w-full resize-none rounded-lg border border-line p-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-40"
            />
            {notifySent ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" /> Mensaje enviado correctamente
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="btn-outline px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendNotify}
                  disabled={!notifyMessage.trim() || !order.customer || notifyCustomer.isPending}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {notifyCustomer.isPending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <PageHeader
        title={`Pedido ${order.number}`}
        description={`Realizado el ${new Date(order.createdAt).toLocaleString("es-AR")}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/pedidos" className="btn-outline px-4 py-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Link>
            <button onClick={handleComprobante} className="btn-outline flex items-center gap-1.5 px-4 py-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Comprobante
            </button>
            <button
              onClick={() => setShowNotifyModal(true)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <Bell className="h-3.5 w-3.5" /> Avisar al cliente
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">

          {/* ── Estado ── */}
          <Card title="Estado del pedido">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={order.status}
                onChange={(e) => updateStatus.mutate({ id, status: e.target.value })}
                disabled={updateStatus.isPending}
                className={`rounded-full border-0 px-4 py-2 text-sm font-medium capitalize outline-none transition-opacity disabled:opacity-60 ${ORDER_STATUS_STYLE[order.status] ?? "bg-stone-bg text-body"}`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-muted">
                {updateStatus.isPending
                  ? "Guardando…"
                  : "El cliente recibe un email automático al cambiar el estado."}
              </span>
            </div>

            {order.status === "cancelado" ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                <X className="h-4 w-4" /> Pedido cancelado
              </div>
            ) : (
              <div className="mt-6 flex items-start">
                {track.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {/* Line before */}
                      <div className={`h-0.5 flex-1 transition-colors ${i === 0 ? "invisible" : i <= stepIndex ? "bg-brand" : "bg-line"}`} />
                      {/* Circle */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 transition-all ${
                          i < stepIndex
                            ? "bg-brand text-white ring-brand"
                            : i === stepIndex
                            ? "bg-brand text-white ring-brand ring-offset-2"
                            : "bg-white text-muted ring-line"
                        }`}
                      >
                        {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {/* Line after */}
                      <div className={`h-0.5 flex-1 transition-colors ${i === track.length - 1 ? "invisible" : i < stepIndex ? "bg-brand" : "bg-line"}`} />
                    </div>
                    <span
                      className={`mt-1.5 text-center text-[10px] leading-tight capitalize ${
                        i <= stepIndex ? "font-medium text-ink" : "text-muted"
                      }`}
                    >
                      {STATUS_LABELS[s] ?? s}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Productos ── */}
          <Card title="Productos" padded={false}>
            <ul className="divide-y divide-line">
              {order.items.map((it: any, i: number) => (
                <li key={i} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-muted">{it.variantLabel ?? ""} · x{it.quantity}</p>
                  </div>
                  <span className="font-semibold text-ink">{formatPrice(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line bg-stone-bg/50 p-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-body">Subtotal</dt>
                <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Descuento {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-body">Envío</dt>
                <dd className="text-ink">{order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {/* ── Nota interna ── */}
          <Card title="Nota interna">
            <textarea
              value={displayNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar comentario interno del pedido..."
              rows={3}
              className="w-full resize-none rounded-lg border border-line p-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Solo visible para el equipo.</span>
              <div className="flex items-center gap-2">
                {updateNotes.isSuccess && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" /> Guardado
                  </span>
                )}
                <button
                  onClick={handleSaveNotes}
                  disabled={updateNotes.isPending || displayNotes === (order.notes ?? "")}
                  className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  {updateNotes.isPending ? "Guardando…" : "Guardar nota"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex h-fit flex-col gap-5">
          <Card title="Cliente">
            {order.customer ? (
              <>
                <p className="font-medium text-ink">{order.customer.name}</p>
                <p className="text-xs text-muted">{order.customer.email}</p>
                <Link
                  href={`/admin/clientes/${order.customer.id}`}
                  className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
                >
                  Ver ficha →
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted">Compra como invitado</p>
            )}
          </Card>

          <Card title="Envío">
            <div className="flex flex-col gap-2.5">
              <KV label="Método">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> {order.shippingMethod ?? "—"}
                </span>
              </KV>
              {order.address?.tracking && (
                <KV label="Seguimiento">{order.address.tracking}</KV>
              )}
              {order.address && (
                <div className="flex items-start gap-2 border-t border-line pt-2.5 text-sm text-body">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {[order.address.street, order.address.number, order.address.city, order.address.zip]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </Card>

          <Card title="Pago">
            <Badge
              className={
                order.paymentStatus === "aprobado"
                  ? "bg-green-50 text-green-700"
                  : "bg-stone-bg text-body"
              }
            >
              {order.paymentStatus}
            </Badge>
            <p className="mt-2 text-sm text-body">{PAYMENT_METHOD_LABEL[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—"}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

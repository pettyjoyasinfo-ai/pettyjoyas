/** Clases de color por estado (presentación, no datos). */

export const ORDER_STATUS_STYLE: Record<string, string> = {
  entregado: "bg-green-50 text-green-700",
  enviado: "bg-blue-50 text-blue-700",
  preparacion: "bg-amber-50 text-amber-700",
  pagado: "bg-khaki-100 text-gold-700",
  pendiente: "bg-stone-bg text-body",
  reserva: "bg-purple-50 text-purple-700",
  cancelado: "bg-red-50 text-red-600",
};

export const SEGMENT_STYLE: Record<string, string> = {
  vip: "bg-gold-100 text-gold-700",
  recurrente: "bg-blue-50 text-blue-700",
  nuevo: "bg-green-50 text-green-700",
  inactivo: "bg-stone-bg text-muted",
};

export const MOVEMENT_STYLE: Record<string, string> = {
  SALE: "bg-red-50 text-red-600",
  PURCHASE: "bg-green-50 text-green-700",
  ADJUSTMENT: "bg-blue-50 text-blue-700",
  RETURN: "bg-amber-50 text-amber-700",
  INVENTORY_COUNT: "bg-stone-bg text-body",
};

/** Etiquetas legibles por método de pago (para tablas/detalle en el admin). */
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mercadopago: "MercadoPago",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta (POS)",
  tarjeta_credito: "Tarjeta de crédito",
  reserva: "Reserva",
};

export const ORDER_STATUSES = [
  "pendiente",
  "reserva",
  "pagado",
  "preparacion",
  "enviado",
  "entregado",
  "cancelado",
] as const;

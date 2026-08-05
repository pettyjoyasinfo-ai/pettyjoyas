/**
 * Datos mock para las pantallas de Mi Cuenta y el Panel Admin.
 * Solo diseño: en producción provienen de la API de Laravel.
 */

export const MOCK_ORDERS = [
  { id: "PJ-002431", date: "08/06/2026", status: "entregado", items: 2, total: 131000, customer: "María Pérez", channel: "online", payment: "MercadoPago" },
  { id: "PJ-002430", date: "06/06/2026", status: "enviado", items: 1, total: 89000, customer: "Lucía Martínez", channel: "online", payment: "Transferencia" },
  { id: "PJ-002429", date: "05/06/2026", status: "preparacion", items: 3, total: 214000, customer: "Sofía Díaz", channel: "online", payment: "MercadoPago" },
  { id: "PJ-002428", date: "05/06/2026", status: "pagado", items: 1, total: 42000, customer: "Venta local", channel: "local", payment: "QR MercadoPago" },
  { id: "PJ-002427", date: "04/06/2026", status: "entregado", items: 2, total: 156000, customer: "Carla Gómez", channel: "online", payment: "MercadoPago" },
  { id: "PJ-002426", date: "03/06/2026", status: "cancelado", items: 1, total: 58000, customer: "Julieta Ríos", channel: "online", payment: "Transferencia" },
] as const;

export const ORDER_STATUS_STYLE: Record<string, string> = {
  entregado: "bg-green-50 text-green-700",
  enviado: "bg-blue-50 text-blue-700",
  preparacion: "bg-amber-50 text-amber-700",
  pagado: "bg-khaki-100 text-gold-700",
  pendiente: "bg-stone-bg text-body",
  cancelado: "bg-red-50 text-red-600",
};

export const MOCK_ORDER_DETAIL = {
  id: "PJ-002431",
  date: "8 de junio de 2026 · 15:42",
  status: "entregado",
  items: [
    { name: "Anillo Solitario Aura", variant: "Talle 16", qty: 1, price: 89000, image: "/assets/img/product/4/product-1.jpg", slug: "anillo-solitario-aura" },
    { name: "Aros Argolla Luna", variant: "Plata 925", qty: 1, price: 42000, image: "/assets/img/product/4/product-3.jpg", slug: "aros-argolla-luna" },
  ],
  subtotal: 131000,
  discount: 13100,
  coupon: "BIENVENIDA10",
  shipping: 0,
  total: 117900,
  payment: "MercadoPago · Visa terminada en 4421",
  address: "Av. Santa Fe 1234, 5°B · CABA (1059)",
  tracking: "AR04392811223",
  timeline: [
    { label: "Pedido recibido", date: "08/06 15:42", done: true },
    { label: "Pago confirmado", date: "08/06 15:43", done: true },
    { label: "En preparación", date: "09/06 10:15", done: true },
    { label: "Enviado", date: "09/06 18:30", done: true },
    { label: "Entregado", date: "11/06 12:05", done: true },
  ],
};

export const MOCK_ADDRESSES = [
  { id: 1, label: "Casa", street: "Av. Santa Fe 1234, 5°B", city: "CABA", zip: "1059", default: true },
  { id: 2, label: "Trabajo", street: "Reconquista 656, PB", city: "CABA", zip: "1003", default: false },
];

export const MOCK_MY_COUPONS = [
  { code: "CUMPLE-MP25", desc: "25% off por tu cumpleaños 🎂", expires: "Vence el 12/07/2026", state: "activo" },
  { code: "BIENVENIDA10", desc: "10% off primera compra", expires: "Usado el 08/06/2026", state: "usado" },
  { code: "PETTY15", desc: "15% en compras desde $120.000", expires: "Vence el 30/06/2026", state: "activo" },
];

export const MOCK_CUSTOMERS = [
  { id: 1, name: "María Pérez", email: "maria.perez@gmail.com", phone: "+54 9 11 5123-4567", segment: "vip", orders: 8, spent: 742000, birthday: "12/07", tags: ["frecuente"] },
  { id: 2, name: "Lucía Martínez", email: "lu.martinez@hotmail.com", phone: "+54 9 11 6234-5678", segment: "recurrente", orders: 3, spent: 268000, birthday: "03/09", tags: [] },
  { id: 3, name: "Sofía Díaz", email: "sofidiaz@gmail.com", phone: "+54 9 351 412-3456", segment: "nuevo", orders: 1, spent: 214000, birthday: "21/06", tags: ["influencer"] },
  { id: 4, name: "Carla Gómez", email: "carla.g@yahoo.com", phone: "+54 9 11 7345-6789", segment: "recurrente", orders: 4, spent: 391000, birthday: "28/06", tags: ["mayorista"] },
  { id: 5, name: "Julieta Ríos", email: "julirios@gmail.com", phone: "+54 9 261 523-4567", segment: "inactivo", orders: 2, spent: 96000, birthday: "15/11", tags: [] },
];

export const SEGMENT_STYLE: Record<string, string> = {
  vip: "bg-gold-100 text-gold-700",
  recurrente: "bg-blue-50 text-blue-700",
  nuevo: "bg-green-50 text-green-700",
  inactivo: "bg-stone-bg text-muted",
};

export const MOCK_STOCK_MOVEMENTS = [
  { id: 1, date: "11/06 12:40", product: "Anillo Solitario Aura · T16", type: "SALE", qty: -1, user: "Tienda online", ref: "PJ-002431" },
  { id: 2, date: "11/06 11:05", product: "Aros Argolla Luna · Plata", type: "SALE", qty: -1, user: "POS · Romina", ref: "PJ-002428" },
  { id: 3, date: "10/06 17:20", product: "Collar Gota Celeste · 45cm", type: "PURCHASE", qty: 12, user: "Admin", ref: "OC-0092" },
  { id: 4, date: "10/06 10:00", product: "Pulsera Tennis Brillante", type: "INVENTORY_COUNT", qty: -1, user: "Scanner · Depósito", ref: "INV-031" },
  { id: 5, date: "09/06 16:45", product: "Conjunto Perla Margot", type: "RETURN", qty: 1, user: "Admin", ref: "PJ-002419" },
  { id: 6, date: "09/06 09:30", product: "Reloj Minimal Petite · Dorado", type: "ADJUSTMENT", qty: 2, user: "Admin", ref: "—" },
];

export const MOVEMENT_STYLE: Record<string, string> = {
  SALE: "bg-red-50 text-red-600",
  PURCHASE: "bg-green-50 text-green-700",
  ADJUSTMENT: "bg-blue-50 text-blue-700",
  RETURN: "bg-amber-50 text-amber-700",
  INVENTORY_COUNT: "bg-stone-bg text-body",
};

/** Historial de compras del cliente (detalle CRM). Mezcla canal online y local. */
export const MOCK_CUSTOMER_PURCHASES = [
  { id: "PJ-002431", date: "08/06/2026", channel: "online", items: "Anillo Solitario Aura + 1 más", total: 117900, coupon: "BIENVENIDA10" },
  { id: "PJ-002388", date: "14/05/2026", channel: "local", items: "Aros Pendientes Gala", total: 95000, coupon: null },
  { id: "PJ-002301", date: "02/04/2026", channel: "online", items: "Collar Gota Celeste", total: 76000, coupon: null },
  { id: "PJ-002240", date: "19/02/2026", channel: "local", items: "Pulsera Esclava Vienna", total: 64000, coupon: "PETTY15" },
  { id: "PJ-002105", date: "20/12/2025", channel: "online", items: "Conjunto Perla Margot", total: 138000, coupon: null },
] as const;

export const MOCK_CONVERSATIONS = [
  { id: 1, name: "Valentina S.", last: "¿Tienen el anillo Aura en talle 14?", time: "hace 5 min", unread: true },
  { id: 2, name: "Romina T.", last: "Gracias! Ya hice el pedido 💕", time: "hace 1 h", unread: false },
  { id: 3, name: "Anónimo", last: "¿Hacen envíos a Córdoba?", time: "hace 3 h", unread: false },
  { id: 4, name: "Paula M.", last: "Quiero un grabado personalizado", time: "ayer", unread: false },
];

export const MOCK_ADMIN_COUPONS = [
  { code: "BIENVENIDA10", type: "10%", uses: "184 / ∞", status: "activo", until: "Sin vencimiento" },
  { code: "CUMPLE-*", type: "25%", uses: "37 / mes", status: "activo", until: "Automático" },
  { code: "PETTY15", type: "15%", uses: "52 / 100", status: "activo", until: "30/06/2026" },
  { code: "FLASH20", type: "20%", uses: "100 / 100", status: "agotado", until: "01/06/2026" },
  { code: "ENVIOGRATIS", type: "$6.500", uses: "210 / ∞", status: "pausado", until: "Sin vencimiento" },
];

export const MOCK_EMAIL_FLOWS = [
  { name: "Bienvenida + cupón 10%", trigger: "Al registrarse", sent: 412, openRate: "62%", active: true },
  { name: "Carrito abandonado (3 recordatorios)", trigger: "1h / 24h / 72h", sent: 1240, openRate: "41%", active: true },
  { name: "Cumpleaños 🎂 25% off", trigger: "7 días antes", sent: 96, openRate: "78%", active: true },
  { name: "Post-compra: cuidado de tu joya", trigger: "3 días después de entrega", sent: 388, openRate: "55%", active: true },
  { name: "Reactivación 90 días", trigger: "Sin compras hace 90 días", sent: 154, openRate: "23%", active: false },
];

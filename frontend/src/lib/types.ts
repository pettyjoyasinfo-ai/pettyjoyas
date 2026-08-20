/** Tipos del dominio: catálogo, carrito, cupones y pedidos. */

export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  /** Para ordenar/destacar en la home. */
  featured?: boolean;
  /** Slug de la categoría padre, si es subcategoría. */
  parentSlug?: string | null;
};

export type ProductBadge = "nuevo" | "oferta" | "destacado" | "agotado";

export type VariantOptionType = "material" | "talle" | "largo" | "color" | "piedra";

export type ProductVariant = {
  id: string;
  /** Etiqueta visible, ej: "Oro 18k · Talle 16". */
  label: string;
  type: VariantOptionType;
  /** Subgrupo opcional dentro del type (ej. "Femenino"/"Masculino" en talles de alianzas). */
  group?: string | null;
  value: string;
  sku: string;
  stock: number;
  /** Ajuste de precio sobre el precio base (puede ser 0 o negativo). */
  priceDelta?: number;
  /** Peso en gramos, opcional (no todos los productos se venden por peso). */
  weight?: number | null;
  /** Imagen propia de la variante; al seleccionarla se muestra en la galería. */
  imageUrl?: string | null;
};

export type ProductSpecs = {
  material?: string;
  piedra?: string;
  quilates?: string;
  peso?: string;
  dimensiones?: string;
  garantia?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  collection?: string;
  /** Precio base en ARS. */
  price: number;
  /** Precio original tachado (si está en oferta). */
  compareAtPrice?: number | null;
  /** Nombre de la promo activa (ej. "20% OFF en Aros"), si aplica. */
  discountName?: string | null;
  images: string[];
  shortDescription: string;
  description: string;
  specs: ProductSpecs;
  variants: ProductVariant[];
  /** Stock total (suma de variantes o stock simple). */
  stock: number;
  rating: number;
  reviewsCount: number;
  badges: ProductBadge[];
  whatsappUrl?: string | null;
  createdAt: string;
};

export type Review = {
  id: number;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type CartItem = {
  /** Clave única por producto+variante. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  /** Precio unitario final (base + delta de variante). */
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  maxStock: number;
  /** Id de la línea en el carrito del backend (cuando hay sesión). */
  serverId?: number | null;
  /** Estado de validación contra el catálogo vivo. */
  status?: "ok" | "adjusted" | "out_of_stock" | "price_changed" | "unavailable";
  /** Precio anterior, si cambió mientras estaba en el carrito. */
  previousPrice?: number | null;
  /** Stock disponible en vivo. */
  availableStock?: number;
  /** ISO timestamp hasta el que el backend reserva estas unidades (solo usuarios logueados). */
  reservedUntil?: string | null;
};

export type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  /** Monto mínimo de compra para aplicar (ARS). */
  minSubtotal?: number;
  description: string;
};

export type ShippingMethod = "envio" | "retiro";
export type PaymentMethod = "mercadopago" | "transferencia" | "efectivo" | "tarjeta_credito";

export type OrderStatus =
  | "pendiente"
  | "pagado"
  | "preparacion"
  | "enviado"
  | "entregado"
  | "cancelado";

export type OrderItem = {
  productId: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
};

export type OrderCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document?: string;
};

export type OrderAddress = {
  street: string;
  number: string;
  apartment?: string;
  city: string;
  province: string;
  zip: string;
  notes?: string;
};

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  items: OrderItem[];
  customer: OrderCustomer;
  shippingMethod: ShippingMethod;
  address?: OrderAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  createdAt: string;
};

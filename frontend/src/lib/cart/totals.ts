import { SITE } from "@/lib/site";
import type { CartItem, Coupon, PaymentMethod, ShippingMethod } from "@/lib/types";

export type CartTotals = {
  subtotal: number;
  /** Descuento del cupón solo (para mostrar aparte del de transferencia). */
  couponDiscountAmount: number;
  /** Descuento por pagar con transferencia (config de /admin/configuracion). */
  transferDiscountAmount: number;
  /** Suma de ambos — es lo que realmente se resta del subtotal. */
  discount: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  freeShipping: boolean;
  /** Cuánto falta para envío gratis (0 si ya califica). */
  remainingForFreeShipping: number;
};

/** Calcula el descuento de un cupón sobre un subtotal dado. */
export function couponDiscount(coupon: Coupon | null | undefined, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === "percent") {
    return Math.round((subtotal * coupon.value) / 100);
  }
  return Math.min(coupon.value, subtotal);
}

/** Calcula todos los totales del carrito. */
export function computeTotals(
  items: CartItem[],
  options: {
    coupon?: Coupon | null;
    shippingMethod?: ShippingMethod;
    paymentMethod?: PaymentMethod;
    /** % de descuento por transferencia real de /admin/configuracion (0-100). */
    transferDiscountPct?: number;
    /** Costo/umbral reales de /admin/configuracion. Si no se pasan, caen al default de SITE.shipping. */
    shippingRates?: { flatRate: number; freeThreshold: number };
  } = {},
): CartTotals {
  const {
    coupon,
    shippingMethod = "envio",
    paymentMethod,
    transferDiscountPct = 0,
    shippingRates = SITE.shipping,
  } = options;

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const couponDiscountAmount = couponDiscount(coupon, subtotal);

  // Sobre el subtotal ya con el cupón aplicado — igual que el backend
  // (CreateSaleAction/SalesService::transferDiscount), para que el total
  // mostrado acá coincida con lo que realmente se cobra.
  const transferDiscountAmount =
    paymentMethod === "transferencia" && transferDiscountPct > 0
      ? Math.round((subtotal - couponDiscountAmount) * (transferDiscountPct / 100))
      : 0;

  const discount = couponDiscountAmount + transferDiscountAmount;

  // El envío ya no se cobra automático acá: el costo real (si corresponde)
  // se coordina aparte con el cliente por WhatsApp/email.
  const shippingCost = 0;
  const freeShipping = true;
  const remainingForFreeShipping = 0;

  const total = Math.max(0, subtotal - discount + shippingCost);

  return {
    subtotal,
    couponDiscountAmount,
    transferDiscountAmount,
    discount,
    shippingCost,
    total,
    itemCount,
    freeShipping,
    remainingForFreeShipping,
  };
}

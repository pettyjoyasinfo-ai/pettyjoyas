/**
 * Eventos estándar de Meta (Pixel) para e-commerce. El script base (fbq init +
 * PageView) vive en components/analytics/meta-pixel.tsx — acá solo están los
 * disparadores de los eventos de conversión reales, para no repetir la
 * lógica de "¿existe window.fbq?" en cada lugar del sitio que los necesita.
 */

const CURRENCY = "ARS";

function fire(event: string, params: Record<string, unknown>, eventID?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) {
    window.fbq("track", event, params, { eventID });
  } else {
    window.fbq("track", event, params);
  }
}

/** Alguien vio la ficha de un producto puntual. */
export function trackViewContent(p: { id: string; name: string; price: number }) {
  fire("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.price,
    currency: CURRENCY,
  });
}

/** Alguien agregó un producto al carrito. */
export function trackAddToCart(p: { id: string; name: string; price: number; quantity: number }) {
  fire("AddToCart", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    contents: [{ id: p.id, quantity: p.quantity }],
    value: p.price * p.quantity,
    currency: CURRENCY,
  });
}

type CartLine = { id: string; quantity: number };

/** Alguien llegó al checkout con el carrito armado. */
export function trackInitiateCheckout(p: { items: CartLine[]; value: number }) {
  fire("InitiateCheckout", {
    content_ids: p.items.map((it) => it.id),
    contents: p.items.map((it) => ({ id: it.id, quantity: it.quantity })),
    num_items: p.items.reduce((sum, it) => sum + it.quantity, 0),
    value: p.value,
    currency: CURRENCY,
  });
}

/**
 * Compra confirmada. `eventID` = número de pedido: es lo que Meta usa para
 * deduplicar si este mismo evento llegara también por Conversions API server-
 * side el día que se implemente, y de paso evita que un F5 en /pedido-
 * confirmado dispare el evento de nuevo (ver dedup por sessionStorage en el
 * lugar donde se llama a esta función).
 */
export function trackPurchase(p: { orderNumber: string; items: CartLine[]; value: number }) {
  fire(
    "Purchase",
    {
      content_ids: p.items.map((it) => it.id),
      contents: p.items.map((it) => ({ id: it.id, quantity: it.quantity })),
      num_items: p.items.reduce((sum, it) => sum + it.quantity, 0),
      value: p.value,
      currency: CURRENCY,
    },
    p.orderNumber,
  );
}

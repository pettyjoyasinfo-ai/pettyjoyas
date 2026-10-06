import type { MetadataRoute } from "next";

/**
 * Evita que los rastreadores recorran las combinaciones de filtros y orden de
 * /tienda (cada URL distinta es un render dinámico con varias llamadas a la
 * API). Las categorías (?categoria=) y la paginación (?pagina=) se dejan
 * abiertas a propósito: son la forma en que se descubren los productos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/carrito",
          "/checkout",
          "/cuenta",
          "/mi-cuenta",
          "/*?*orden=",
          "/*?*min=",
          "/*?*max=",
          "/*?*q=",
          "/*?*material=",
          "/*?*oferta=",
          "/*?*promo=",
        ],
      },
    ],
  };
}

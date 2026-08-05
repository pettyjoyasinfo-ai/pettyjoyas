/** Configuración global de la marca / sitio. */
export const SITE = {
  name: "Petty Joyas",
  legalName: "Petty Joyas",
  description:
    "Joyería con más de 30 años de trayectoria: anillos, collares, aros y pulseras de calidad en oro y plata.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pettyjoyas.com",
  email: "pettyjoyas1@outlook.com",
  phone: "3757 403878",
  whatsapp: "543757403878",
  address: "Av. Victoria Aguirre 262, N3370 Puerto Iguazú, Misiones",
  schedule: "Lun a Sáb · 9 a 12:30 y 17 a 21:30 h",
  social: {
    instagram: "https://www.instagram.com/pettyjoyas/",
  },
  shipping: {
    /** Umbral de envío gratis, en ARS. */
    freeThreshold: 80000,
    /** Costo de envío estándar, en ARS. */
    flatRate: 6500,
  },
} as const;

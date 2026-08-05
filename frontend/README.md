# Petty Joyas — Frontend (Next.js)

Storefront y futura PWA/POS de Petty Joyas. Construido con **Next.js 16 (App Router)**,
**TypeScript**, **Tailwind CSS v4**, **React Query** e **IndexedDB** (offline-first).

> Estado actual: **modo demo con datos MOCK** (sin backend) para mostrar el diseño y
> desplegar en Vercel. El frontend nunca accede a la base de datos: consume la API REST
> de Laravel vía HTTPS. Mientras `NEXT_PUBLIC_API_URL` esté vacío, se usan los mocks de
> `src/lib/data`.

## Stack

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS v4 (design system en `src/app/globals.css`)
- TanStack React Query (estado de servidor)
- Zustand (carrito, estado de cliente con persistencia en localStorage)
- IndexedDB vía `idb` (cola de eventos offline)
- Swiper (carruseles) · lucide-react (íconos)
- PWA (manifest + service worker)

## Scripts

```bash
npm run dev      # desarrollo (http://localhost:3000)
npm run build    # build de producción
npm run start    # servir el build
```

## Variables de entorno

Copiá `.env.example` a `.env.local`. Para el modo demo no hace falta configurar nada.

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (SEO). |
| `NEXT_PUBLIC_API_URL` | Base de la API de Laravel. Vacío = mocks. |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Clave pública de MercadoPago (checkout). |

## Estructura

```
src/
  app/                 # Rutas (App Router)
    page.tsx           # Home
    tienda/            # Catálogo con filtros (SSR por searchParams)
    producto/[slug]/   # Ficha de producto (SSG)
    carrito/           # Carrito
    checkout/          # Checkout (datos, envío, pago, cupón)
    pedido-confirmado/ # Confirmación de compra
    nosotros, contacto, cuenta, favoritos, envios, ...
  components/          # UI (layout, home, product, cart, shop, ui)
  lib/
    api/               # Cliente HTTP + React Query (seam hacia Laravel)
    data/              # MOCKS del catálogo (seed) + acceso
    cart/              # Store del carrito + cálculo de totales
    offline/           # IndexedDB: cola de eventos de negocio + sync
    site.ts, navigation.ts, types.ts, utils.ts
public/
  assets/img/          # Imágenes de la plantilla (demo)
  manifest.webmanifest, sw.js
```

## Conexión con el backend (cuando esté listo)

El único punto a tocar es `src/lib/api/catalog.ts`: reemplazar el cuerpo de cada
función por una llamada `apiFetch(...)` (ya implementada en `src/lib/api/client.ts`).
La UI, los hooks y los tipos no cambian.

Eventos offline (ventas/stock) se encolan en IndexedDB (`src/lib/offline/db.ts`) y se
sincronizan contra `POST /sync/events` de Laravel cuando vuelve la conexión
(`src/lib/offline/sync.ts`).

## Deploy en Vercel

1. Importar el repo en Vercel.
2. **Root Directory: `frontend`** (es un monorepo: `frontend/` + `backend/`).
3. Framework: Next.js (autodetectado). Build: `next build`.
4. Variables de entorno: dejar `NEXT_PUBLIC_API_URL` vacío para el demo con mocks.

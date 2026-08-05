# Petty Joyas — Sistema Web Integral

Monorepo del sistema de Petty Joyas: tienda online + (futuro) POS con stock unificado.
Frontend y backend **separados**.

```
PaginaWeb/
├── frontend/   → Next.js 16 (App Router, PWA, React Query, IndexedDB)  → Vercel
└── backend/    → Laravel 12 (API REST, Sanctum, Eloquent)              → Hostinger + MySQL
```

## Estado actual

- **Frontend: COMPLETO en modo demo (mocks).** Storefront navegable y desplegable a Vercel
  para mostrar el diseño. No depende del backend (usa datos de `frontend/src/lib/data`).
- **Backend: estructura de carpetas + documentación.** La lógica se implementa por fases
  siguiendo `backend/ARCHITECTURE.md` y `backend/docs/modules/`.

## Arquitectura (resumen)

- El frontend **nunca** accede a la base de datos: consume la API REST de Laravel vía HTTPS.
- Toda la lógica de negocio vive en Laravel (Actions + Services).
- Inventario por **event sourcing**: el stock se deriva de `stock_movements`.
- Offline-first: se sincronizan **eventos de negocio** (no bases de datos) vía IndexedDB.

Detalle: [`backend/ARCHITECTURE.md`](./backend/ARCHITECTURE.md).

## Cómo correr

```bash
# Frontend (demo con mocks)
cd frontend && npm install && npm run dev      # http://localhost:3000

# Backend (cuando se implemente)
cd backend && composer install && php artisan serve
```

## Deploy

- **Frontend → Vercel** con Root Directory = `frontend`.
- **Backend → Hostinger** (PHP 8.2+, MySQL).

## Referencia del proyecto

El alcance funcional completo está en `../propuesta_joyeria.pdf` y la plantilla de diseño
original en `../index-4.html` (Shofy, variante joyería), migrada a React/Tailwind.

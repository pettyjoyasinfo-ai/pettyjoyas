# Backend Laravel — Roadmap por fases

Plan de implementación de la API REST. Cada fase es entregable e independiente.
Base arquitectónica: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Detalle por módulo: [`docs/modules/`](./docs/modules).

> Convención transversal: Controllers delgados → Form Requests (validación) → Actions
> (1 operación) → Services (dominio) → Eloquent. Respuestas con API Resources.
> Stock = event sourcing (`stock_movements`). Auth = Sanctum (Bearer token).

---

## ✅ Fase 1 — Fundación + Catálogo + Inventario  (IMPLEMENTADA)
La columna vertebral del sistema.

- Config: `.env` MySQL, CORS, **Laravel Sanctum**, estructura `/api`.
- Migraciones: `users` (con `role`), `categories`, `products`, `product_variants`,
  `product_images`, `stock_movements`.
- Modelos Eloquent + relaciones. Enums: `StockMovementType`, `UserRole`.
- `InventoryService` — deriva el stock de los movimientos.
- Actions: `CreateProductAction`, `UpdateProductAction`, `AdjustStockAction`.
- Controllers API: `AuthController` (register/login/logout/me), `CategoryController`,
  `ProductController` (+ `lookup?barcode=`), `InventoryController`.
- Form Requests + Resources + `routes/api.php`.
- Seeder con los mismos datos del front (12 productos, 6 categorías).

**Resultado:** el storefront puede dejar los mocks y consumir `/api/products`,
`/api/categories`, `/api/products/{slug}` reales.

---

## Fase 2 — Pedidos + POS + Pagos
- Migraciones: `orders`, `order_items`, `sale_channels`.
- `CreateSaleAction`: valida stock, crea pedido + ítems, genera movimientos `SALE`
  (descuenta stock unificado), aplica cupón, numera el pedido.
- Estados de pedido (`OrderStatus`) + notificación por email en cada cambio.
- Integración **MercadoPago**: preferencia de pago (online) y **QR de cobro** (POS).
- Transferencia bancaria. Webhook de confirmación de pago.
- Endpoints: `GET/POST /orders`, `PATCH /orders/{id}/status`, `POST /pos/sales`,
  `POST /payments/mercadopago/webhook`.

## Fase 3 — Clientes (CRM) + Marketing
- Migraciones: `customers`, `addresses`, `coupons`, `coupon_redemptions`, `email_flows`.
- Segmentación automática (nuevo/recurrente/VIP/inactivo) + VIP manual + etiquetas + notas.
- Vínculo de venta presencial por email → historial unificado físico/online.
- Motor de cupones (porcentaje/fijo/volumen, mínimos, límites, vencimiento).
- Emails automáticos (workflows): bienvenida, carrito abandonado, post-compra,
  reactivación. Campaña de cumpleaños (job programado).
- Endpoints CRM + envío de email individual.

## Fase 4 — Sincronización Offline + Scanner
- Migración: `sync_events` (idempotencia por UUID del cliente).
- `IngestBusinessEventAction`: procesa `SALE_CREATED`, `STOCK_ADJUSTED`,
  `PRODUCT_CREATED/UPDATED`, `INVENTORY_COUNT` de forma idempotente.
- `POST /sync/events` (lote). Resolución de `barcode` para el scanner (ya en Fase 1).

## Fase 5 — Reportes + Meta Ads
- Endpoints de reportes: dashboard, comparativas mensual/trimestral/anual,
  top productos, LTV de clientes, rendimiento de cupones. Export Excel/PDF.
- Meta Conversions API (server-side): Purchase, AddToCart, etc. + verificación de dominio
  y sincronización de catálogo (feed).

## Fase 6 — WhatsApp Bot (IA sobre la BD)
Ver [`docs/modules/10-whatsapp-bot.md`](./docs/modules/10-whatsapp-bot.md).
- WhatsApp **Cloud API** (número empresarial). Webhook en Laravel.
- Bot con **Claude (tool-use)**: herramientas `buscarProducto`, `verStock`,
  `estadoPedido`, `recomendar`, `derivarAHumano` que consultan la BD real.
- Base de conocimiento (FAQ) + captura de leads al CRM.

---

### Cómo correr (Fase 1)
```bash
cd backend
cp .env.example .env          # configurar DB MySQL de Hostinger/local
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://localhost:8000/api
```
En el frontend, setear `NEXT_PUBLIC_API_URL=http://localhost:8000/api` para dejar los mocks.

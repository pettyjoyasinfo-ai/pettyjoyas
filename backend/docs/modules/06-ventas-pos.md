# Módulo 6 — Ventas POS

## Objetivo
Registrar ventas presenciales y online en un mismo flujo. Cada venta descuenta stock
(genera `stock_movements` tipo `SALE`) y queda auditada.

## Tablas
- `sales` (number, channel [`online`|`local`], customer_id nullable, status [`OrderStatus`],
  payment_method, subtotal, discount, shipping_cost, total, coupon_code, user_id, created_at).
- `sale_items` (sale_id, product_id, variant_id, name, unit_price, quantity).

## Endpoints (REST)
```
GET    /api/sales                # listado (staff)
GET    /api/sales/{id}           # detalle
POST   /api/sales                # crear venta (online o POS)
PATCH  /api/sales/{id}/status    # cambiar estado del pedido
```

## Actions / Services
- `CreateSaleAction`: valida stock (`InventoryService::assertAvailable`), crea `sale` +
  `sale_items`, genera movimientos `SALE` (descuenta stock), aplica cupón, numera el pedido.
- `RefundSaleAction`: genera movimientos `RETURN`.
- `SalesService`: totales, cupones, numeración.

## Reglas
- Una sola fuente de stock para ambos canales (ver módulo 4).
- Pago: `mercadopago` (online), `transferencia`, `efectivo` (POS).
- Cobro presencial vía QR de MercadoPago (genera la preferencia desde el backend).

## Offline
La venta presencial puede crearse offline: el frontend encola `SALE_CREATED` y se procesa
con `CreateSaleAction` al sincronizar (ver módulo 9). Idempotente por `event.id`.

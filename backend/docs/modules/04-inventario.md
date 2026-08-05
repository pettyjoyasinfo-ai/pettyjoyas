# Módulo 4 — Inventario (event sourcing)

## Objetivo
Stock **unificado** entre canal online y local, **derivado de movimientos**. Una venta en
el mostrador descuenta el stock web y viceversa. Cero doble gestión.

## Regla central
**Nunca** se edita el stock directamente. Cada cambio = un registro en `stock_movements`.

```
stock_actual = Σ stock_movements.quantity (con signo) por product_id/variant_id
```

## Tablas
- `stock_movements`
  - `id`, `product_id`, `variant_id` (nullable)
  - `type` (`StockMovementType`: SALE, PURCHASE, ADJUSTMENT, RETURN, INVENTORY_COUNT)
  - `quantity` (positivo entra, negativo sale)
  - `reference_type` / `reference_id` (ej. venta que lo originó) — polimórfico
  - `note`, `user_id`, `created_at`

## Endpoints (REST)
```
GET    /api/inventory/stock?product_id=        # stock derivado actual
POST   /api/inventory/movements                # registrar movimiento (staff)
POST   /api/inventory/count                     # inventario físico (ajuste por conteo)
GET    /api/inventory/movements?product_id=     # historial auditable
```

## Services / Actions
- `InventoryService::currentStock($product, $variant)` — suma de movimientos.
- `InventoryService::assertAvailable(...)` — valida antes de vender.
- `AdjustStockAction`, `RegisterInventoryCountAction`.

## Reglas
- Stock bajo configurable (umbral de alerta).
- Si el stock deriva a 0, el producto se oculta del catálogo web.
- Conteo físico genera un movimiento `INVENTORY_COUNT` que ajusta al valor contado.

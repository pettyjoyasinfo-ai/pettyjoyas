# Módulo 9 — Sincronización Offline

## Objetivo
Permitir operar el POS sin internet (ventas, ajustes de stock, inventarios, alta/edición de
productos) y sincronizar al recuperar la conexión. **Se sincronizan eventos de negocio, no
bases de datos.**

## Flujo
1. El frontend (PWA) encola eventos en IndexedDB (`frontend/src/lib/offline/db.ts`).
2. Al volver online, los envía en orden a la API (`frontend/src/lib/offline/sync.ts`).
3. El backend los procesa de forma **idempotente** por `event.id` (UUID del cliente).

## Eventos (`BusinessEventType`)
`SALE_CREATED`, `STOCK_ADJUSTED`, `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `INVENTORY_COUNT`.

## Tabla
- `sync_events` (`id` UUID PK [idempotencia], `type`, `payload` JSON, `status`
  [`accepted`|`duplicate`|`error`], `client_created_at`, `processed_at`, `error`).

## Endpoint (REST)
```
POST /api/sync/events     # acepta un evento o un lote
```
Respuesta por evento: `{ id, status }`.

## Action / Service
- `IngestBusinessEventAction`: si `id` ya existe → `duplicate`; si no, registra y despacha:
  - `SALE_CREATED` → `CreateSaleAction`
  - `STOCK_ADJUSTED` / `INVENTORY_COUNT` → `AdjustStockAction` / `RegisterInventoryCountAction`
  - `PRODUCT_CREATED` / `PRODUCT_UPDATED` → `CreateProductAction` / `UpdateProductAction`

## Reglas
- Idempotencia obligatoria (reintentos no deben duplicar ventas/movimientos).
- Orden cronológico por `client_created_at`.
- Conflictos de stock se resuelven con el modelo de movimientos (todo queda registrado).

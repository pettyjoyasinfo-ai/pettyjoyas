# Petty Joyas — Backend (Laravel) · Arquitectura

> Documento maestro de contexto. **Leer antes de generar o modificar código** del backend.
> El backend es la **única fuente de verdad** y contiene **toda la lógica de negocio**.

## 1. Stack y decisiones (no negociables)

| Capa | Tecnología |
| --- | --- |
| Framework | **Laravel 12** (PHP 8.2+) |
| API | **REST** (JSON), versionada bajo `/api` |
| Auth | **Laravel Sanctum** (tokens) |
| ORM | **Eloquent** |
| Base de datos | **MySQL** (Hostinger) |
| Migraciones | **Laravel Migrations** |
| Validación | **Form Requests** |
| Organización | **Services** + **Actions** |

### Restricciones (prohibido)
- ❌ Supabase, Firebase, Prisma, MongoDB, GraphQL.
- ❌ Lógica de negocio crítica en el frontend o en Server Actions de Next.js.
- ❌ Acceso directo a la base de datos desde Next.js.
- ✅ El frontend (Next.js en Vercel) consume **exclusivamente** esta API vía HTTPS.

## 2. Infraestructura

```
[ Next.js PWA ]  --HTTPS-->  [ Laravel API ]  -->  [ MySQL ]
   Vercel                       Hostinger            Hostinger
```

## 3. Patrón de capas

```
Route (routes/api.php)
  -> Controller (app/Http/Controllers/Api)        # delgado: orquesta, no decide
     -> Form Request (app/Http/Requests)          # valida la entrada
     -> Action (app/Actions)                       # UNA operación de negocio
        -> Service (app/Services)                  # lógica de dominio reutilizable
           -> Model (app/Models) / Eloquent        # persistencia
     -> API Resource (app/Http/Resources)          # forma de la respuesta JSON
```

- **Controllers**: finos. Reciben el Form Request, llaman a una Action, devuelven un Resource.
- **Actions**: una clase = una operación (`CreateSaleAction`, `AdjustStockAction`). Atómicas y testeables.
- **Services**: reglas de dominio compartidas (ej. `InventoryService::currentStock()`).
- **Form Requests**: toda validación de entrada vive acá.
- **Resources**: nunca devolver modelos Eloquent crudos; serializar con Resources.
- **Enums**: tipos cerrados (`StockMovementType`, `OrderStatus`, `BusinessEventType`).

## 4. Inventario = event sourcing (regla central)

**El stock NUNCA se edita directamente.** Cada cambio genera un registro en
`stock_movements`. El stock actual se **deriva** sumando los movimientos.

Tipos de movimiento (`StockMovementType`):
`SALE`, `PURCHASE`, `ADJUSTMENT`, `RETURN`, `INVENTORY_COUNT`.

```
stock_actual(producto/variante) = Σ stock_movements.quantity   (con signo)
```

Beneficios: trazabilidad total, auditoría, conciliación entre canales (online + local),
y compatibilidad con el modelo offline (cada movimiento es un evento idempotente).

## 5. Offline-first: se sincronizan EVENTOS, no bases de datos

El frontend (POS/PWA) encola **eventos de negocio** en IndexedDB y los envía cuando hay
conexión. El backend los procesa de forma **idempotente** por `event.id` (UUID del cliente).

Eventos: `SALE_CREATED`, `STOCK_ADJUSTED`, `PRODUCT_CREATED`, `PRODUCT_UPDATED`,
`INVENTORY_COUNT`.

Endpoint de ingesta: `POST /api/sync/events` (acepta uno o un lote). Cada evento:
1. Se registra en `sync_events` (con su `id` para idempotencia).
2. Dispara la Action correspondiente (ej. `SALE_CREATED` → `CreateSaleAction`).
3. Devuelve el estado (`accepted` / `duplicate` / `error`).

## 6. Scanner (código de barras)

Los lectores USB/Bluetooth se comportan como **teclado (HID)**: "tipean" el código y un
Enter. **No requieren SDK**. El backend solo necesita:
- `barcode` único por producto/variante (índice).
- Endpoint de búsqueda: `GET /api/products/lookup?barcode=...`.

## 7. Convenciones de API

- Prefijo `/api`. Respuestas JSON. Códigos HTTP correctos (422 validación, 401/403 auth).
- Paginación estándar de Laravel para listados.
- Autenticación con `Authorization: Bearer <token>` (Sanctum) salvo endpoints públicos
  del catálogo (lectura).
- Errores con forma consistente: `{ "message": ..., "errors": {...} }`.

## 8. Módulos iniciales

1. Autenticación · 2. Productos · 3. Categorías · 4. Inventario · 5. Scanner ·
6. Ventas POS · 7. Clientes · 8. Reportes · 9. Sincronización Offline.

Detalle de cada uno en [`docs/modules/`](./docs/modules).

## 9. Estado actual

Solo **estructura de carpetas + documentación**. Las migraciones, modelos, actions,
services, requests, resources y controllers se implementan en fases siguientes,
respetando estrictamente este documento.

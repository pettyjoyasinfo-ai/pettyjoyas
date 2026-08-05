# Reglas para agentes IA — Backend Petty Joyas

**Antes de escribir código, leé [`ARCHITECTURE.md`](./ARCHITECTURE.md) y el `.md` del módulo
correspondiente en [`docs/modules/`](./docs/modules).**

## Reglas duras
1. Toda la lógica de negocio vive en Laravel (Actions + Services). Nunca en el frontend.
2. El stock no se edita directo: se crean registros en `stock_movements`. El stock se deriva.
3. Validación de entrada → **Form Requests**. Respuestas → **API Resources** (no modelos crudos).
4. Controllers delgados: validan (Form Request), llaman una Action, devuelven un Resource.
5. Una Action = una operación de negocio, atómica e idempotente cuando aplique.
6. Sincronización offline: procesar eventos por `id` (UUID del cliente) de forma idempotente.
7. Auth con Sanctum (Bearer token). Catálogo de lectura puede ser público.

## Prohibido
- Supabase, Firebase, Prisma, MongoDB, GraphQL.
- Server Actions de Next.js para lógica crítica.
- Acceso a la DB desde Next.js.

## Convenciones
- PHP 8.2+, tipado estricto donde sea posible, Enums para tipos cerrados.
- Nombres de Actions en imperativo: `CreateSaleAction`, `AdjustStockAction`.
- Migraciones para todo cambio de esquema. MySQL.
- Tests con PHPUnit/Pest para Actions y Services.

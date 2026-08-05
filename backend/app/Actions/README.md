# app/Actions

Acciones de negocio: **una clase = una operación**. Atómicas, testeables y, cuando aplique,
idempotentes (ej. ingesta de eventos offline).

Organizadas por módulo:

```
Actions/
  Sales/        CreateSaleAction, RefundSaleAction
  Inventory/    AdjustStockAction, RegisterInventoryCountAction
  Products/     CreateProductAction, UpdateProductAction
  Sync/         IngestBusinessEventAction
```

Convención: nombre en imperativo + sufijo `Action`. Reciben datos ya validados (desde un
Form Request) y devuelven el modelo/resultado. La lógica de dominio compartida se delega a
los **Services**.

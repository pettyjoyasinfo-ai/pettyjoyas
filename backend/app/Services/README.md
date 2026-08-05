# app/Services

Servicios de dominio: lógica **reutilizable** que usan varias Actions/Controllers.

```
Services/
  Inventory/    InventoryService   # currentStock(), assertAvailable(), movement()
  Sales/        SalesService       # totales, cupones, numeración de pedidos
  Sync/         SyncService        # idempotencia y despacho de eventos
```

Regla clave: el stock se calcula en `InventoryService` a partir de `stock_movements`
(nunca un campo `stock` mutable en `products`).

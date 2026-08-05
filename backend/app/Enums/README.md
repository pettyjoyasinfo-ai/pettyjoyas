# app/Enums

Tipos cerrados del dominio (PHP 8.1+ enums).

Previstos:
- `StockMovementType`: `SALE`, `PURCHASE`, `ADJUSTMENT`, `RETURN`, `INVENTORY_COUNT`.
- `OrderStatus`: `pendiente`, `pagado`, `preparacion`, `enviado`, `entregado`, `cancelado`.
- `BusinessEventType`: `SALE_CREATED`, `STOCK_ADJUSTED`, `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `INVENTORY_COUNT`.
- `SaleChannel`: `online`, `local`.
- `PaymentMethod`: `mercadopago`, `transferencia`, `efectivo`.

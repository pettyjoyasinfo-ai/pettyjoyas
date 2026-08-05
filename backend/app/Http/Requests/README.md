# app/Http/Requests

**Form Requests**: toda la validación de entrada vive acá (reglas + autorización).

Ejemplos previstos: `StoreProductRequest`, `UpdateProductRequest`, `StoreSaleRequest`,
`AdjustStockRequest`, `IngestEventRequest`, `LoginRequest`, `RegisterRequest`.

Los Controllers reciben el Form Request ya validado vía `->validated()`.

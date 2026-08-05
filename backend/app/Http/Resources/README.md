# app/Http/Resources

**API Resources**: definen la forma del JSON de salida. Nunca devolver modelos Eloquent
crudos al cliente.

Ejemplos previstos: `ProductResource`, `CategoryResource`, `SaleResource`,
`StockMovementResource`, `CustomerResource`, `UserResource`.

Mantener los nombres de campos consistentes con los `types.ts` del frontend
(`frontend/src/lib/types.ts`) para que el seam de la API encaje sin fricción.

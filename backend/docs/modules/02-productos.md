# Módulo 2 — Productos

## Objetivo
Catálogo con productos, **variantes** (material, talle, largo, color, piedra), múltiples
imágenes, precios y precio comparativo (oferta). Catálogo ilimitado.

## Tablas
- `products` (slug, name, category_id, collection, price, compare_at_price, short_description,
  description, specs JSON, rating, badges, barcode, active).
- `product_variants` (product_id, label, type, value, sku, barcode, price_delta).
- `product_images` (product_id, url, position).

> El stock NO es una columna: se deriva de `stock_movements` (ver módulo 4).

## Endpoints (REST)
```
GET    /api/products                 # listado + filtros (categoria, material, precio, q, orden)
GET    /api/products/{slug}          # detalle
GET    /api/products/lookup?barcode= # búsqueda por código (scanner)
POST   /api/products                 # alta (staff)
PUT    /api/products/{id}            # edición (staff)
DELETE /api/products/{id}            # archivar (staff)
```

## Actions / Services
`CreateProductAction`, `UpdateProductAction`. Generación de `barcode` único por producto/variante.

## Form Requests / Resources
`StoreProductRequest`, `UpdateProductRequest` · `ProductResource`, `ProductVariantResource`.

## Reglas
- Filtros y orden equivalentes a `ProductFilters` del frontend.
- `ProductResource` debe coincidir con `Product` de `frontend/src/lib/types.ts`.

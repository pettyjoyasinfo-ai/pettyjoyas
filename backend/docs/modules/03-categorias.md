# Módulo 3 — Categorías

## Objetivo
Categorías y subcategorías ilimitadas (anillos, collares, aros, pulseras, conjuntos, etc.).

## Tablas
- `categories` (slug, name, description, image, parent_id nullable, featured, position).

## Endpoints (REST)
```
GET    /api/categories          # árbol/listado
POST   /api/categories          # alta (staff)
PUT    /api/categories/{id}     # edición (staff)
DELETE /api/categories/{id}     # baja (staff)
```

## Resources
`CategoryResource` (coincide con `Category` de `frontend/src/lib/types.ts`).

## Reglas
- `parent_id` permite subcategorías. `featured` para destacar en la home.

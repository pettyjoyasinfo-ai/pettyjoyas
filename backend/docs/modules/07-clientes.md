# Módulo 7 — Clientes (mini CRM)

## Objetivo
Base única de clientes (online + local) con historial de compras, segmentación y notas.
Base para fidelización (cumpleaños, reactivación, etc.).

## Tablas
- `customers` (name, email, phone, birthday, document, address JSON, tags JSON, notes,
  segment [`nuevo`|`recurrente`|`vip`|`inactivo`], created_at).
- Relación con `sales` (historial de compras).

## Endpoints (REST)
```
GET    /api/customers                 # listado + filtros/búsqueda (staff)
GET    /api/customers/{id}            # ficha + historial
POST   /api/customers                 # alta
PUT    /api/customers/{id}            # edición
GET    /api/customers/birthdays       # próximos cumpleaños (campañas)
```

## Reglas
- Segmentación automática por comportamiento (gasto/frecuencia/recencia).
- Etiquetas libres (mayorista, influencer, etc.) y notas internas.
- Alimenta reportes (LTV) y futuras automatizaciones de marketing.

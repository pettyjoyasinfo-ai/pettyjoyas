# Módulo 8 — Reportes

## Objetivo
Dashboard de métricas del negocio: ventas, ticket promedio, productos más vendidos,
clientes más valiosos (LTV), uso de cupones.

## Endpoints (REST)
```
GET /api/reports/dashboard?from=&to=     # KPIs: ingresos, ticket prom., conversión, nuevos clientes
GET /api/reports/top-products?from=&to=  # más vendidos / más vistos
GET /api/reports/top-customers           # LTV
GET /api/reports/coupons                 # uso y descuento otorgado
```

## Implementación
- Consultas agregadas con Eloquent/Query Builder sobre `sales`, `sale_items`,
  `stock_movements`, `customers`.
- Exportación a Excel/PDF (fase posterior).

## Reglas
- Rango de fechas configurable. Solo staff (`admin`).

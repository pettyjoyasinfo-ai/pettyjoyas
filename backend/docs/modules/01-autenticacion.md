# Módulo 1 — Autenticación

## Objetivo
Login/registro de clientes y staff (admin, vendedor) con **Laravel Sanctum** (tokens).
Roles y permisos para separar tienda online (clientes) del panel/POS (staff).

## Tablas
- `users` (con `role`: `admin` | `vendedor` | `cliente`).
- `personal_access_tokens` (Sanctum).

## Endpoints (REST)
```
POST   /api/auth/register      # alta de cliente
POST   /api/auth/login         # devuelve token Bearer
POST   /api/auth/logout        # revoca token (auth)
GET    /api/auth/me            # perfil actual (auth)
```

## Form Requests
`RegisterRequest`, `LoginRequest`.

## Reglas
- Token Bearer en `Authorization`. Endpoints de catálogo (lectura) pueden ser públicos.
- El POS exige rol `admin`/`vendedor`.
- Hash de contraseñas con bcrypt (default de Laravel).

## Notas
- Capa de cliente en frontend: guardar token y mandarlo vía `apiFetch({ token })`.

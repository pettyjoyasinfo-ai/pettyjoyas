# Módulo 5 — Scanner (código de barras)

## Objetivo
Usar lectores USB/Bluetooth para búsqueda rápida en el POS y para entrada/salida de stock.

## Principio
Los scanners se comportan como **teclado (HID)**: "tipean" el código + Enter. **No requieren
SDK propietario**. El frontend captura el input; el backend solo resuelve el código.

## Soporte de formatos
EAN-13, EAN-8, Code 128, Code 39, QR (generación de etiquetas se documenta en el módulo de
productos / etiquetas).

## Backend necesario
- Columna `barcode` única e indexada en `products` y `product_variants`.
- Endpoint de resolución:
```
GET /api/products/lookup?barcode=7791234567890
```
Devuelve el producto/variante para mostrarlo al instante o registrar un movimiento de stock.

## Reglas
- `barcode` único. La generación automática vive en `CreateProductAction`.

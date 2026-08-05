<?php

namespace App\Enums;

/**
 * Tipos de movimiento de stock. El stock actual se deriva de la suma de movimientos.
 * El signo de la cantidad lo define el negocio (SALE resta, PURCHASE suma, etc.).
 */
enum StockMovementType: string
{
    case Sale = 'SALE';
    case Purchase = 'PURCHASE';
    case Adjustment = 'ADJUSTMENT';
    case Return = 'RETURN';
    case InventoryCount = 'INVENTORY_COUNT';
}

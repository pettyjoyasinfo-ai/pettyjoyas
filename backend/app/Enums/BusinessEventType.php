<?php

namespace App\Enums;

enum BusinessEventType: string
{
    case SaleCreated = 'SALE_CREATED';
    case StockAdjusted = 'STOCK_ADJUSTED';
    case ProductCreated = 'PRODUCT_CREATED';
    case ProductUpdated = 'PRODUCT_UPDATED';
    case InventoryCount = 'INVENTORY_COUNT';
}

<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\Inventory\InventoryService;

class AdjustStockAction
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * @param  array  $data  Validado (AdjustStockRequest): type, quantity, product_variant_id?, note?
     */
    public function execute(Product $product, array $data, ?int $userId = null): StockMovement
    {
        $type = StockMovementType::from($data['type']);
        $variantId = $data['product_variant_id'] ?? null;

        // Conteo físico: la cantidad enviada es el total contado, no el delta.
        if ($type === StockMovementType::InventoryCount) {
            return $this->inventory->setByCount($product, (int) $data['quantity'], $variantId, $userId);
        }

        // SALE y RETURN normalizan el signo según el tipo.
        $qty = (int) $data['quantity'];
        if ($type === StockMovementType::Sale) {
            $qty = -abs($qty);
        }

        return $this->inventory->recordMovement(
            $product, $type, $qty, $variantId, $data['note'] ?? null, $userId,
        );
    }
}

<?php

namespace App\Actions\Sync;

use App\Actions\Inventory\AdjustStockAction;
use App\Actions\Products\CreateProductAction;
use App\Actions\Sales\CreateSaleAction;
use App\Enums\BusinessEventType;
use App\Models\Product;
use App\Models\SyncEvent;

/**
 * Procesa un evento de negocio offline de forma IDEMPOTENTE (por UUID del
 * cliente): si el evento ya existe, no lo reprocesa. Despacha a la Action real.
 */
class IngestBusinessEventAction
{
    public function __construct(
        private CreateSaleAction $createSale,
        private AdjustStockAction $adjustStock,
        private CreateProductAction $createProduct,
    ) {}

    public function execute(array $event, ?int $userId = null): array
    {
        $id = $event['id'];

        // Idempotencia: si ya se procesó, devolver "duplicate".
        if (SyncEvent::whereKey($id)->exists()) {
            return ['id' => $id, 'status' => 'duplicate'];
        }

        $type = BusinessEventType::from($event['type']);
        $payload = $event['payload'] ?? [];

        $record = SyncEvent::create([
            'id' => $id,
            'type' => $type,
            'payload' => $payload,
            'status' => 'accepted',
            'client_created_at' => $event['created_at'] ?? null,
        ]);

        try {
            match ($type) {
                BusinessEventType::SaleCreated => $this->createSale->execute($payload, $userId),
                BusinessEventType::StockAdjusted,
                BusinessEventType::InventoryCount => $this->adjustStock->execute(
                    Product::findOrFail($payload['product_id']),
                    $payload,
                    $userId,
                ),
                BusinessEventType::ProductCreated => $this->createProduct->execute($payload, $userId),
                BusinessEventType::ProductUpdated => null, // (UpdateProductAction en fase siguiente)
            };

            $record->update(['processed_at' => now()]);

            return ['id' => $id, 'status' => 'accepted'];
        } catch (\Throwable $e) {
            $record->update(['status' => 'error', 'error' => $e->getMessage()]);

            return ['id' => $id, 'status' => 'error', 'message' => $e->getMessage()];
        }
    }
}

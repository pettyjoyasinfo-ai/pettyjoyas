<?php

namespace App\Http\Controllers\Api;

use App\Actions\Sync\IngestBusinessEventAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /**
     * Ingesta de eventos offline (uno o un lote). Idempotente por `id` (UUID).
     * El frontend PWA encola estos eventos y los envía al recuperar conexión.
     */
    public function events(Request $request, IngestBusinessEventAction $action)
    {
        $data = $request->validate([
            'events' => ['required', 'array', 'min:1'],
            'events.*.id' => ['required', 'uuid'],
            'events.*.type' => ['required', 'in:SALE_CREATED,STOCK_ADJUSTED,PRODUCT_CREATED,PRODUCT_UPDATED,INVENTORY_COUNT'],
            'events.*.payload' => ['nullable', 'array'],
            'events.*.created_at' => ['nullable', 'integer'],
        ]);

        $userId = $request->user()?->id;
        $results = array_map(fn ($e) => $action->execute($e, $userId), $data['events']);

        return response()->json(['results' => $results]);
    }
}

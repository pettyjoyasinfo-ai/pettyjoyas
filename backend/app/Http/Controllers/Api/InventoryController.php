<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * Stock disponible de un producto, descontando reservas de otros carritos activos.
     * Si hay sesión o token de carrito de invitado, se excluye el carrito propio
     * para que su reserva no reste del stock que él mismo ve. No crea un carrito
     * nuevo solo por consultar stock (a diferencia de CartService::resolve()).
     */
    public function stock(Request $request)
    {
        $request->validate(['product_id' => ['required', 'exists:products,id']]);
        $productId = (int) $request->query('product_id');

        $cart = $this->ownCart($request);

        return response()->json([
            'product_id' => (string) $productId,
            'stock' => $this->inventory->currentStock($productId, null, $cart?->id),
            'by_variant' => $this->inventory->stockByVariant($productId, $cart?->id),
        ]);
    }

    private function ownCart(Request $request): ?Cart
    {
        if ($user = $request->user('sanctum')) {
            return Cart::firstWhere('user_id', $user->id);
        }

        if ($token = $request->header('X-Guest-Cart-Token')) {
            return Cart::firstWhere('guest_token', $token);
        }

        return null;
    }
}

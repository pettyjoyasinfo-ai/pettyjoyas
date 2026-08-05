<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cart) {}

    /** Carrito (de usuario o invitado), validado contra el catálogo vivo. */
    public function index(Request $request)
    {
        $cart = $this->cart->resolve($request);

        return response()->json(
            $this->cart->snapshotFor($cart, $request->query('promo')),
        );
    }

    /** Agrega (o suma) un ítem. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $cart = $this->cart->resolve($request);
        $this->cart->add(
            $cart,
            (int) $data['product_id'],
            isset($data['product_variant_id']) ? (int) $data['product_variant_id'] : null,
            (int) ($data['quantity'] ?? 1),
        );

        return response()->json($this->cart->snapshotFor($cart), 201);
    }

    /** Fija la cantidad de una línea. */
    public function update(Request $request, int $item)
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:0']]);
        $cart = $this->cart->resolve($request);
        $this->cart->setQuantity($cart, $item, (int) $data['quantity']);

        return response()->json($this->cart->snapshotFor($cart));
    }

    public function destroy(Request $request, int $item)
    {
        $cart = $this->cart->resolve($request);
        $this->cart->remove($cart, $item);

        return response()->json($this->cart->snapshotFor($cart));
    }

    /** Vacía el carrito (tras confirmar el pedido, por ejemplo). */
    public function clear(Request $request)
    {
        $cart = $this->cart->resolve($request);
        $this->cart->clear($cart);

        return response()->json($this->cart->snapshotFor($cart));
    }

    /**
     * Fusiona los ítems de invitado al loguearse (requiere sesión). Si la
     * request trae el token del carrito de invitado, borra esa fila tras
     * fusionar — libera su reserva de stock de inmediato (no espera a que
     * venza) y evita carritos huérfanos.
     */
    public function merge(Request $request)
    {
        $data = $request->validate([
            'items' => ['present', 'array'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.product_variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $cart = $this->cart->forUser($request->user());
        $this->cart->merge($cart, $data['items']);

        if ($token = $request->header('X-Guest-Cart-Token')) {
            Cart::where('guest_token', $token)->delete();
        }

        return response()->json($this->cart->snapshotFor($cart));
    }

    /**
     * Valida una lista de ítems SIN persistir. Ya no lo usa el frontend
     * (los invitados tienen carrito real vía `resolve()`), se mantiene por
     * compatibilidad para integraciones externas.
     */
    public function validateItems(Request $request)
    {
        $data = $request->validate([
            'items' => ['present', 'array'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.product_variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'integer'],
        ]);

        return response()->json(
            $this->cart->validateItems($data['items'], $request->query('promo')),
        );
    }
}

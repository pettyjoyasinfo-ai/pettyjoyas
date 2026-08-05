<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\UserResource;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Datos de la cuenta del cliente autenticado (mi-cuenta del storefront).
 */
class AccountController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    // ─── Pedidos ──────────────────────────────────────────────────────────

    public function orders(Request $request)
    {
        $email  = $request->user()->email;
        $orders = Order::with(['items'])
            ->whereHas('customer', fn ($q) => $q->where('email', $email))
            ->latest()
            ->get();

        return OrderResource::collection($orders);
    }

    public function order(Request $request, Order $order)
    {
        abort_unless($order->customer && $order->customer->email === $request->user()->email, 403);

        return new OrderResource($order->load(['items', 'payments', 'customer']));
    }

    // ─── Perfil ───────────────────────────────────────────────────────────

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name'                  => ['sometimes', 'string', 'max:255'],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'birthday'              => ['nullable', 'date'],
            'current_password'      => ['sometimes', 'nullable', 'string'],
            'password'              => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = $request->user();

        // Cambio de contraseña
        if (!empty($data['password'])) {
            if (empty($data['current_password']) || !Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
            }
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        unset($data['current_password'], $data['password_confirmation']);

        $user->update($data);

        // Sincronizar con Customer si existe
        if ($customer = $this->customerFor($request)) {
            $syncFields = array_intersect_key($data, array_flip(['name', 'phone', 'birthday']));
            if ($syncFields) {
                $customer->update($syncFields);
            }
        }

        return new UserResource($user->fresh());
    }

    // ─── Direcciones ──────────────────────────────────────────────────────

    public function addresses(Request $request)
    {
        $customer = $this->customerFor($request);
        if (!$customer) return response()->json([]);

        return response()->json(
            $customer->addresses()->orderByDesc('is_default')->orderBy('id')->get()
        );
    }

    public function storeAddress(Request $request)
    {
        $customer = $this->customerFor($request);
        abort_unless($customer, 404, 'No se encontró el perfil del cliente.');

        $data = $request->validate([
            'label'      => ['required', 'string', 'max:50'],
            'street'     => ['required', 'string', 'max:255'],
            'city'       => ['required', 'string', 'max:100'],
            'province'   => ['nullable', 'string', 'max:100'],
            'zip'        => ['nullable', 'string', 'max:20'],
            'is_default' => ['boolean'],
        ]);

        if (!empty($data['is_default'])) {
            $customer->addresses()->update(['is_default' => false]);
        }

        // Primera dirección siempre es predeterminada
        if ($customer->addresses()->count() === 0) {
            $data['is_default'] = true;
        }

        $address = $customer->addresses()->create($data);

        return response()->json($address, 201);
    }

    public function updateAddress(Request $request, Address $address)
    {
        $this->ownsAddress($request, $address);

        $data = $request->validate([
            'label'      => ['sometimes', 'string', 'max:50'],
            'street'     => ['sometimes', 'string', 'max:255'],
            'city'       => ['sometimes', 'string', 'max:100'],
            'province'   => ['nullable', 'string', 'max:100'],
            'zip'        => ['nullable', 'string', 'max:20'],
            'is_default' => ['boolean'],
        ]);

        if (!empty($data['is_default'])) {
            $customer = $this->customerFor($request);
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($data);

        return response()->json($address->fresh());
    }

    public function destroyAddress(Request $request, Address $address)
    {
        $this->ownsAddress($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        // Si era predeterminada, hacer predeterminada la más antigua que quede
        if ($wasDefault) {
            $customer = $this->customerFor($request);
            $customer?->addresses()->oldest()->first()?->update(['is_default' => true]);
        }

        return response()->noContent();
    }

    // ─── Favoritos ────────────────────────────────────────────────────────

    public function favorites(Request $request)
    {
        $ids      = $request->user()->favorites()->pluck('product_id');
        $products = Product::with(['category', 'variants', 'images'])->whereIn('id', $ids)->get();

        $products->each(function (Product $p) {
            $p->stock_total = $this->inventory->currentStock($p->id);
            $byVariant = $this->inventory->stockByVariant($p->id);
            $p->variants->each(fn ($v) => $v->stock = $byVariant[$v->id] ?? 0);
        });

        return ProductResource::collection($products);
    }

    public function toggleFavorite(Request $request)
    {
        $data     = $request->validate(['product_id' => ['required', 'exists:products,id']]);
        $user     = $request->user();
        $existing = $user->favorites()->where('product_id', $data['product_id'])->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['favorited' => false]);
        }

        $user->favorites()->create(['product_id' => $data['product_id']]);

        return response()->json(['favorited' => true]);
    }

    public function favoriteIds(Request $request)
    {
        return response()->json(
            $request->user()->favorites()->pluck('product_id')->map(fn ($id) => (string) $id)
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function customerFor(Request $request): ?Customer
    {
        $user = $request->user();
        return Customer::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();
    }

    private function ownsAddress(Request $request, Address $address): void
    {
        $customer = $this->customerFor($request);
        abort_unless($customer && $address->customer_id === $customer->id, 403);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Actions\Sales\CreateSaleAction;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use App\Services\Payments\PaymentService;
use App\Services\Sales\SalesService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = $this->buildQuery($request)->paginate(20);
        return OrderResource::collection($orders);
    }

    public function export(Request $request)
    {
        $orders = $this->buildQuery($request)->get();
        return OrderResource::collection($orders);
    }

    private function buildQuery(Request $request)
    {
        return Order::query()
            ->with(['customer', 'items'])
            ->when($request->query('estado'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->query('canal'), fn ($q, $c) => $q->where('channel', $c))
            ->when($request->query('metodo_pago'), fn ($q, $m) => $q->where('payment_method', $m))
            ->when($request->query('fecha_desde'), fn ($q, $f) => $q->whereDate('created_at', '>=', $f))
            ->when($request->query('fecha_hasta'), fn ($q, $f) => $q->whereDate('created_at', '<=', $f))
            ->when($request->query('total_min'), fn ($q, $v) => $q->where('total', '>=', (int) $v))
            ->when($request->query('total_max'), fn ($q, $v) => $q->where('total', '<=', (int) $v))
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($c) => $c
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest();
    }

    public function show(Order $order)
    {
        return new OrderResource($order->load(['customer', 'items', 'payments']));
    }

    /**
     * Consulta pública del estado real de un pedido (público, sin auth) —
     * usada por /pedido-confirmado al volver de MercadoPago, para no confiar
     * ciegamente en el ?status= de la URL (el webhook es la fuente de verdad).
     * Requiere número + email para no dejar adivinar pedidos de otros por
     * número secuencial.
     */
    public function lookup(Request $request)
    {
        $data = $request->validate([
            'number' => ['required', 'string'],
            'email'  => ['required', 'email'],
        ]);

        $order = Order::with(['customer', 'items'])
            ->where('number', $data['number'])
            ->whereHas('customer', fn ($q) => $q->whereRaw('LOWER(email) = ?', [strtolower($data['email'])]))
            ->firstOrFail();

        return new OrderResource($order);
    }

    /** Checkout online (público). Crea la orden y devuelve el dato de pago según el método. */
    public function store(StoreSaleRequest $request, CreateSaleAction $action, PaymentService $payments)
    {
        $data = ['channel' => 'online', ...$request->validated()];

        // El propio carrito del comprador (logueado o invitado) se excluye
        // al validar stock — su propia reserva no debe contar como "tomada"
        // por otro cuando está comprando justamente eso.
        $excludeCartId = $this->buyersCartId($request);

        $order = $action->execute($data, $request->user('sanctum')?->id, $excludeCartId);

        $payment = match ($order->payment_method) {
            'mercadopago'   => $payments->createMercadoPagoPreference($order),
            'transferencia' => $payments->getTransferInfo(),
            default         => null, // efectivo+retiro: no necesita datos extra
        };

        // Confirmación al cliente + aviso de nuevo pedido al administrador.
        // MercadoPago es la excepción: todavía no pagó nada (recién se
        // redirige al checkout de MP), así que no se avisa a nadie hasta que
        // el webhook confirme el pago real (ver PaymentService::markOrderPaid).
        if ($order->payment_method !== 'mercadopago') {
            $transfer = $order->payment_method === 'transferencia' ? ($payment ?? []) : [];
            \App\Support\Mailer::orderPlaced($order, $transfer, notifyAdmin: true);
        }

        return response()->json([
            'order'   => new OrderResource($order),
            'payment' => $payment,
        ], 201);
    }

    /** Id del carrito del comprador actual (logueado o invitado), si existe. */
    private function buyersCartId(Request $request): ?int
    {
        if ($user = $request->user('sanctum')) {
            return Cart::where('user_id', $user->id)->value('id');
        }

        if ($token = $request->header('X-Guest-Cart-Token')) {
            return Cart::where('guest_token', $token)->value('id');
        }

        return null;
    }

    /** Admin confirma transferencia o efectivo de un pedido online. */
    public function confirmPayment(Request $request, Order $order, PaymentService $payments)
    {
        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $payments->confirmTransferPayment($order, $request->notes);

        \App\Support\Mailer::orderPaid($order->fresh(['customer', 'items']));

        return new OrderResource($order->fresh(['customer', 'items', 'payments']));
    }

    public function updateNotes(Request $request, Order $order)
    {
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $order->update(['notes' => $data['notes'] ?? null]);

        return new OrderResource($order->fresh(['customer', 'items']));
    }

    public function notify(Request $request, Order $order)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        \App\Support\Mailer::orderCustomNotification($order, $data['message']);

        return response()->json(['ok' => true]);
    }

    public function updateStatus(Request $request, Order $order, SalesService $sales)
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
        ]);

        $previous = $order->status;
        $next = OrderStatus::from($data['status']);

        // Cancelación: reponer stock una sola vez (sólo si no estaba ya cancelada).
        if ($next === OrderStatus::Cancelado && $previous !== OrderStatus::Cancelado) {
            $order->loadMissing('items');
            $sales->restockOrder($order);
        }

        $order->update(['status' => $next]);

        // Aviso al cliente del cambio de estado (no rompe el flujo si falla el envío).
        if ($previous !== $next) {
            \App\Support\Mailer::orderStatusUpdated($order->fresh(['customer', 'items']));
        }

        return new OrderResource($order->fresh(['customer', 'items']));
    }
}

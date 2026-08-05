<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Resources\CouponResource;
use App\Mail\CouponPrivateMail;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CouponController extends Controller
{
    public function index()
    {
        return CouponResource::collection(Coupon::latest()->get());
    }

    /** Cupones activos PÚBLICOS visibles para clientes (sección "Mis cupones"). */
    public function active()
    {
        return CouponResource::collection(
            Coupon::where('active', true)
                ->where('is_public', true)
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
                ->latest()
                ->get(),
        );
    }

    public function store(StoreCouponRequest $request)
    {
        $validated = $request->validated();
        $sendTo    = $validated['send_to_email'] ?? null;
        unset($validated['send_to_email']);

        // Defaults
        $validated['is_public'] ??= true;
        $validated['active']    ??= true;

        $coupon = Coupon::create($validated);

        if ($sendTo && ! $coupon->is_public) {
            $this->sendCouponEmail($coupon, $sendTo);
        }

        return (new CouponResource($coupon))->response()->setStatusCode(201);
    }

    public function update(StoreCouponRequest $request, Coupon $coupon)
    {
        $validated = $request->validated();
        $sendTo    = $validated['send_to_email'] ?? null;
        unset($validated['send_to_email']);

        $coupon->update($validated);

        if ($sendTo && ! $coupon->is_public) {
            $this->sendCouponEmail($coupon, $sendTo);
        }

        return new CouponResource($coupon->fresh());
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return response()->noContent();
    }

    /** Envío manual del cupón a un email (para cupones privados). */
    public function send(Request $request, Coupon $coupon)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $this->sendCouponEmail($coupon, $data['email']);

        return response()->json(['message' => 'Cupón enviado por email.']);
    }

    /** Valida un cupón contra un subtotal (usado por el carrito/checkout). */
    public function validateCode(Request $request)
    {
        $data = $request->validate([
            'code'     => ['required', 'string'],
            'subtotal' => ['required', 'integer', 'min:0'],
        ]);

        $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($data['code'])])->first();

        if (! $coupon || ! $coupon->isUsable()) {
            return response()->json(['valid' => false, 'message' => 'Cupón inválido o vencido.'], 422);
        }

        $discount = $coupon->discountFor($data['subtotal']);
        if ($discount <= 0) {
            return response()->json([
                'valid'   => false,
                'message' => "Requiere un mínimo de \${$coupon->min_subtotal}.",
            ], 422);
        }

        return response()->json([
            'valid'    => true,
            'discount' => $discount,
            'coupon'   => new CouponResource($coupon),
        ]);
    }

    private function sendCouponEmail(Coupon $coupon, string $email): void
    {
        try {
            $name = strstr($email, '@', true) ?: 'Hola';
            Mail::to($email)->send(new CouponPrivateMail($coupon, $name));
        } catch (\Throwable $e) {
            Log::warning("Envío cupón privado falló: {$email} — {$e->getMessage()}");
        }
    }
}

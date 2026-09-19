<?php

namespace App\Http\Requests;

use App\Services\Sales\SalesService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // checkout online es público; el POS se protege por ruta
    }

    /**
     * Categorías con pago restringido (ej. "Oro"): solo efectivo o transferencia.
     * Esta misma Request también la usa el POS (channel=local, que sí puede
     * cobrar con tarjeta en el local) — el POS manda channel explícito, la
     * tienda online no, así que "no local" alcanza para distinguir.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('channel') === 'local') {
                return;
            }

            $paymentMethod = $this->input('payment_method');
            if (in_array($paymentMethod, SalesService::RESTRICTED_PAYMENT_METHODS, true)) {
                return;
            }

            $productIds = collect($this->input('items', []))->pluck('product_id')->filter()->all();
            if (! $productIds) {
                return;
            }

            if (app(SalesService::class)->hasRestrictedPaymentProduct($productIds)) {
                $validator->errors()->add(
                    'payment_method',
                    'Los productos de la categoría Oro solo se pueden pagar con efectivo o transferencia.',
                );
            }
        });
    }

    public function rules(): array
    {
        return [
            'channel' => ['nullable', Rule::in(['online', 'local'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'customer' => ['nullable', 'array'],
            'customer.name' => ['nullable', 'string', 'max:255'],
            // Sin sesión, el email es obligatorio: es lo único que permite
            // identificar al comprador invitado y vincularlo si luego se registra.
            'customer.email' => [Rule::requiredIf(fn () => ! $this->user('sanctum')), 'nullable', 'email'],
            'customer.phone' => ['nullable', 'string', 'max:30'],
            'customer.document' => ['nullable', 'string', 'max:30'],
            'coupon_code' => ['nullable', 'string'],
            'payment_method' => ['required', Rule::in(['mercadopago', 'transferencia', 'efectivo', 'tarjeta', 'tarjeta_credito'])],
            'shipping_method' => ['nullable', Rule::in(['envio', 'retiro'])],
            'address' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

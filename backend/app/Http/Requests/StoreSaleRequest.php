<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // checkout online es público; el POS se protege por ruta
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
            'coupon_code' => ['nullable', 'string'],
            'payment_method' => ['required', Rule::in(['mercadopago', 'transferencia', 'efectivo', 'tarjeta', 'tarjeta_credito'])],
            'shipping_method' => ['nullable', Rule::in(['envio', 'retiro'])],
            'address' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

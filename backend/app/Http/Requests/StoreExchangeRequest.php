<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cambio o devolución desde caja. Si no hay artículos entregados es una devolución;
 * con entregados, un cambio (la diferencia de valor se cobra, se reintegra o queda a favor).
 */
class StoreExchangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    public function rules(): array
    {
        return [
            // Venta original (opcional): permite controlar que se devuelva solo lo comprado.
            'original_order_number' => ['nullable', 'string', 'max:40'],
            'reason'                => ['nullable', 'string', 'max:500'],
            'notes'                 => ['nullable', 'string', 'max:500'],

            'returned'                       => ['required', 'array', 'min:1', 'max:30'],
            'returned.*.product_id'          => ['required', 'integer', 'exists:products,id'],
            'returned.*.product_variant_id'  => ['nullable', 'integer', 'exists:product_variants,id'],
            'returned.*.quantity'            => ['required', 'integer', 'min:1', 'max:100'],
            // Valor que se le reconoce al cliente por la pieza (pesos enteros).
            'returned.*.unit_price'          => ['required', 'integer', 'min:0', 'max:100000000'],
            // false = no apta para reventa: se registra pero NO vuelve al stock.
            'returned.*.restock'             => ['required', 'boolean'],

            'delivered'                      => ['nullable', 'array', 'max:30'],
            'delivered.*.product_id'         => ['required', 'integer', 'exists:products,id'],
            'delivered.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'delivered.*.quantity'           => ['required', 'integer', 'min:1', 'max:100'],

            // Medio con el que se cobra la diferencia (o con el que se reintegra).
            'payment_method'        => ['nullable', Rule::in(['efectivo', 'tarjeta', 'transferencia'])],
            // Si la diferencia es a favor del cliente: reintegro por caja o saldo a favor.
            'negative_settlement'   => ['nullable', Rule::in(['saldo_a_favor', 'reintegro'])],
        ];
    }

    public function messages(): array
    {
        return [
            'returned.required'                => 'Agregá el artículo que devuelve el cliente.',
            'returned.min'                     => 'Agregá el artículo que devuelve el cliente.',
            'returned.*.unit_price.required'   => 'Indicá el valor que se reconoce por cada artículo devuelto.',
            'returned.*.unit_price.integer'    => 'El valor tiene que ser un número entero, en pesos.',
            'returned.*.restock.required'      => 'Indicá si el artículo devuelto vuelve al stock.',
            'payment_method.in'                => 'El medio de pago tiene que ser efectivo, tarjeta o transferencia.',
        ];
    }
}

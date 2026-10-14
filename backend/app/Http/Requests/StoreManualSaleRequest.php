<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Venta manual del POS: un cobro libre (descripción + monto + medio de pago)
 * para productos que no están cargados en el sistema.
 */
class StoreManualSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    public function rules(): array
    {
        return [
            'description'    => ['required', 'string', 'max:255'],
            // Pesos enteros, nunca centavos.
            'amount'         => ['required', 'integer', 'min:1', 'max:100000000'],
            'payment_method' => ['required', Rule::in(['efectivo', 'tarjeta', 'transferencia'])],
            'notes'          => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.required'    => 'Escribí qué se vendió.',
            'description.max'         => 'La descripción es demasiado larga (máx. 255 caracteres).',
            'amount.required'         => 'Ingresá el monto cobrado.',
            'amount.integer'          => 'El monto tiene que ser un número entero, en pesos.',
            'amount.min'              => 'El monto tiene que ser mayor a cero.',
            'amount.max'              => 'El monto es demasiado alto: revisalo.',
            'payment_method.required' => 'Elegí el medio de pago.',
            'payment_method.in'       => 'El medio de pago tiene que ser efectivo, tarjeta o transferencia.',
        ];
    }
}

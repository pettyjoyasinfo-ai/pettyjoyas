<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabelSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ruta ya protegida por auth:sanctum
    }

    public function rules(): array
    {
        return [
            'pageW'       => ['required', 'numeric', 'min:1'],
            'pageH'       => ['required', 'numeric', 'min:1'],
            'earW'        => ['required', 'numeric', 'min:1'],
            'earH'        => ['required', 'numeric', 'min:1'],
            'barcodeSide' => ['required', Rule::in(['left', 'right'])],
            'codeType'    => ['required', Rule::in(['qr', 'barcode'])],
            'bcFill'      => ['required', 'numeric', 'min:0.1', 'max:1'],
            'offsetX'     => ['required', 'numeric'],
            'offsetY'     => ['required', 'numeric'],
        ];
    }
}

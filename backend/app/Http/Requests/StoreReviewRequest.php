<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => 'La puntuación es requerida.',
            'rating.min'      => 'La puntuación mínima es 1.',
            'rating.max'      => 'La puntuación máxima es 5.',
            'body.required'   => 'El comentario es requerido.',
            'body.min'        => 'El comentario debe tener al menos 10 caracteres.',
            'body.max'        => 'El comentario no puede superar los 1000 caracteres.',
        ];
    }
}

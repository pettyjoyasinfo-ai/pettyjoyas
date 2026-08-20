<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $cat = $this->input('category_id');
        if ($cat !== null && ! is_numeric($cat)) {
            $slug = str_starts_with((string) $cat, 'cat-') ? substr((string) $cat, 4) : (string) $cat;
            $id = Category::where('slug', $slug)->value('id');
            if ($id) {
                $this->merge(['category_id' => $id]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'collection' => ['nullable', 'string'],
            'price' => ['sometimes', 'integer', 'min:0'],
            // Stock directo del producto — solo aplica cuando no tiene variantes.
            'stock' => ['nullable', 'integer', 'min:0'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'specs' => ['nullable', 'array'],
            'badges' => ['nullable', 'array'],
            'active' => ['boolean'],
            'whatsapp_url' => ['nullable', 'string', 'max:600'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.label' => ['required_with:variants', 'string'],
            'variants.*.type' => ['nullable', 'string'],
            'variants.*.group' => ['nullable', 'string', 'max:100'],
            'variants.*.price_delta' => ['nullable', 'integer'],
            'variants.*.weight' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.image_url' => ['nullable', 'string', 'max:600'],
        ];
    }
}

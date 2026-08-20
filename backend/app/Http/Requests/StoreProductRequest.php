<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    /**
     * El front expone la categoría como "cat-{slug}" (o slug). La resolvemos al
     * id numérico real antes de validar, así el contrato del API es flexible.
     */
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
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'unique:products,slug'],
            'category_id' => ['required', 'exists:categories,id'],
            'collection' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'specs' => ['nullable', 'array'],
            'badges' => ['nullable', 'array'],
            'active' => ['boolean'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'variants' => ['nullable', 'array'],
            'variants.*.label' => ['required_with:variants', 'string'],
            'variants.*.type' => ['nullable', 'string'],
            'variants.*.group' => ['nullable', 'string', 'max:100'],
            'variants.*.sku' => ['nullable', 'string'],
            'variants.*.price_delta' => ['nullable', 'integer'],
            'variants.*.weight' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.image_url' => ['nullable', 'string', 'max:600'],
            'whatsapp_url' => ['nullable', 'string', 'max:600'],
        ];
    }
}

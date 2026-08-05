<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiscountResource;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DiscountController extends Controller
{
    public function index()
    {
        return DiscountResource::collection(Discount::with('category')->latest()->get());
    }

    /** Endpoint público: devuelve info del descuento por token (para la landing /promo/{token}). */
    public function showByToken(string $token)
    {
        $discount = Discount::with('category')
            ->where('token', $token)
            ->where('active', true)
            ->firstOrFail();

        return new DiscountResource($discount);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        if (($data['requires_token'] ?? false) && empty($data['token'])) {
            $data['token'] = Str::lower(Str::random(8));
        }

        $discount = Discount::create($data);

        return (new DiscountResource($discount->load('category')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Discount $discount)
    {
        $discount->update($this->validateData($request));

        return new DiscountResource($discount->load('category'));
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();

        return response()->noContent();
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'integer', 'min:1'],
            'scope' => ['required', 'in:all,category,products'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'active' => ['boolean'],
            'requires_token' => ['boolean'],
        ]);
    }
}

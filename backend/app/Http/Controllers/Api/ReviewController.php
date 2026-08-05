<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(int $productId)
    {
        $product = Product::findOrFail($productId);

        return ReviewResource::collection(
            $product->reviews()->with('user')->latest()->get()
        );
    }

    /** Devuelve si el usuario autenticado puede dejar una reseña sobre este producto. */
    public function canReview(Request $request, int $productId)
    {
        $product = Product::findOrFail($productId);
        $user = $request->user('sanctum');

        if (! $user) {
            return response()->json(['can_review' => false, 'reason' => 'not_auth']);
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['can_review' => false, 'reason' => 'already_reviewed']);
        }

        $hasBoughtDelivered = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Entregado)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();

        if (! $hasBoughtDelivered) {
            return response()->json(['can_review' => false, 'reason' => 'not_purchased']);
        }

        return response()->json(['can_review' => true, 'reason' => null]);
    }

    public function store(StoreReviewRequest $request, int $productId)
    {
        $product = Product::findOrFail($productId);
        $user = $request->user();

        $hasBoughtDelivered = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Entregado)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();

        if (! $hasBoughtDelivered) {
            return response()->json(
                ['message' => 'Solo podés opinar si compraste este producto y ya lo recibiste.'],
                403
            );
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(
                ['message' => 'Ya dejaste una opinión sobre este producto.'],
                422
            );
        }

        $review = $product->reviews()->create([
            'user_id' => $user->id,
            'author'  => $user->name,
            'rating'  => $request->integer('rating'),
            'body'    => $request->string('body')->trim(),
        ]);

        return new ReviewResource($review);
    }
}

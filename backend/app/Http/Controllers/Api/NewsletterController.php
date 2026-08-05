<?php

namespace App\Http\Controllers\Api;

use App\Models\NewsletterSubscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterController extends Controller
{
    /** POST /newsletter — suscripción pública. */
    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name'  => ['nullable', 'string', 'max:120'],
        ]);

        $email = strtolower($data['email']);

        // Busca cliente CRM con ese email para pre-vincular
        $customer = \App\Models\Customer::where('email', $email)->first();

        $sub = NewsletterSubscriber::firstOrCreate(
            ['email' => $email],
            [
                'name'        => $data['name'] ?? $customer?->name ?? null,
                'active'      => true,
                'customer_id' => $customer?->id,
            ],
        );

        if (!$sub->wasRecentlyCreated) {
            $sub->update([
                'active'      => true,
                'customer_id' => $sub->customer_id ?? $customer?->id,
            ]);
        }

        return response()->json(['message' => 'Suscripto correctamente.'], 201);
    }

    /** GET /admin/newsletter — lista de suscriptores con info de cliente CRM. */
    public function index(Request $request): JsonResponse
    {
        $activeOnly = !$request->boolean('active_only') ? false : true;

        $subs = NewsletterSubscriber::query()
            ->with('customer:id,name,segment,vip')
            ->when($activeOnly, fn ($q) => $q->where('active', true))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'email'         => $s->email,
                'name'          => $s->name,
                'active'        => $s->active,
                'created_at'    => $s->created_at,
                'customer_id'   => $s->customer_id,
                'customer_name' => $s->customer?->name,
                'customer_segment' => $s->customer?->segment?->value,
                'customer_vip'  => $s->customer?->vip,
            ]);

        return response()->json([
            'total'       => NewsletterSubscriber::where('active', true)->count(),
            'crm_linked'  => NewsletterSubscriber::where('active', true)->whereNotNull('customer_id')->count(),
            'subscribers' => $subs,
        ]);
    }

    /** DELETE /admin/newsletter/{subscriber} — desuscribir. */
    public function destroy(NewsletterSubscriber $subscriber): JsonResponse
    {
        $subscriber->update(['active' => false]);

        return response()->json(['message' => 'Desuscripto.']);
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Cart;
use App\Models\Customer;
use App\Models\EmailFlow;
use App\Support\Mailer;
use Illuminate\Console\Command;

class SendAbandonedCartEmails extends Command
{
    protected $signature   = 'emails:send-abandoned-carts';
    protected $description = 'Envía un recordatorio a clientes con carritos abandonados hace 1–24 h';

    public function handle(): int
    {
        $flow = EmailFlow::where('trigger', 'abandoned_cart')->first();

        if (! $flow || ! $flow->active) {
            $this->info('Flujo de carrito abandonado inactivo — sin envíos.');
            return self::SUCCESS;
        }

        // Carritos con items, sin email enviado, actualizados hace entre 1 y 24 horas,
        // pertenecientes a un usuario con customer enlazado y email.
        $carts = Cart::whereNull('abandoned_email_sent_at')
            ->where('updated_at', '<=', now()->subHour())
            ->where('updated_at', '>=', now()->subHours(24))
            ->whereHas('items')
            ->whereHas('user.customer', fn ($q) => $q->whereNotNull('email'))
            ->with(['items.product', 'items.variant', 'user.customer'])
            ->get();

        if ($carts->isEmpty()) {
            $this->info('Sin carritos abandonados para notificar.');
            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($carts as $cart) {
            $customer = $cart->user?->customer;
            if (! $customer) continue;

            $items = $cart->items->map(fn ($item) => [
                'name'     => $item->product?->name ?? 'Producto',
                'variant'  => $item->variant ? $item->variant->label ?? '' : '',
                'quantity' => $item->quantity,
            ])->toArray();

            Mailer::abandonedCart($customer, $items, $flow);

            $cart->update(['abandoned_email_sent_at' => now()]);
            $sent++;
        }

        if ($sent > 0) {
            $flow->increment('sent_count', $sent);
        }

        $this->info("Enviados {$sent} recordatorios de carrito abandonado.");

        return self::SUCCESS;
    }
}

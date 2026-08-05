<?php

namespace App\Console\Commands;

use App\Models\EmailFlow;
use App\Models\Order;
use App\Support\Mailer;
use Illuminate\Console\Command;

class SendPostPurchaseEmails extends Command
{
    protected $signature   = 'emails:send-post-purchase';
    protected $description = 'Envía consejos de cuidado de joya 3 días después de marcar un pedido como entregado';

    public function handle(): int
    {
        $flow = EmailFlow::where('trigger', 'post_purchase')->first();

        if (! $flow || ! $flow->active) {
            $this->info('Flujo post-compra inactivo — sin envíos.');
            return self::SUCCESS;
        }

        // Pedidos marcados como entregado entre hace 3 y 4 días.
        // La ventana de 24 h con schedule diario garantiza que cada pedido se capture una sola vez.
        $orders = Order::where('status', 'entregado')
            ->where('updated_at', '<=', now()->subDays(3))
            ->where('updated_at', '>=', now()->subDays(4))
            ->whereHas('customer', fn ($q) => $q->whereNotNull('email'))
            ->with('customer')
            ->get();

        if ($orders->isEmpty()) {
            $this->info('Sin pedidos para notificar hoy.');
            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($orders as $order) {
            $customer = $order->customer;
            if (! $customer) continue;

            Mailer::postPurchase($customer, $flow);
            $sent++;
        }

        if ($sent > 0) {
            $flow->increment('sent_count', $sent);
        }

        $this->info("Enviados {$sent} emails post-compra.");

        return self::SUCCESS;
    }
}

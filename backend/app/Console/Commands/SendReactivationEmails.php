<?php

namespace App\Console\Commands;

use App\Enums\CustomerSegment;
use App\Models\Customer;
use App\Models\EmailFlow;
use App\Support\Mailer;
use Illuminate\Console\Command;

class SendReactivationEmails extends Command
{
    protected $signature   = 'emails:send-reactivation';
    protected $description = 'Envía email de reactivación a clientes sin compras en 90 días';

    public function handle(): int
    {
        $flow = EmailFlow::where('trigger', 'reactivation')->first();

        if (! $flow || ! $flow->active) {
            $this->info('Flujo de reactivación inactivo — sin envíos.');
            return self::SUCCESS;
        }

        // Clientes marcados como inactivos por el scheduler de segmentos, con email,
        // que no hayan recibido email de reactivación en los últimos 6 meses.
        $customers = Customer::where('segment', CustomerSegment::Inactivo)
            ->whereNotNull('email')
            ->where(function ($q) {
                $q->whereNull('reactivation_email_sent_at')
                  ->orWhere('reactivation_email_sent_at', '<=', now()->subMonths(6));
            })
            ->get();

        if ($customers->isEmpty()) {
            $this->info('Sin clientes inactivos para reactivar hoy.');
            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($customers as $customer) {
            Mailer::reactivation($customer, $flow);
            $customer->update(['reactivation_email_sent_at' => now()]);
            $sent++;
        }

        if ($sent > 0) {
            $flow->increment('sent_count', $sent);
        }

        $this->info("Enviados {$sent} emails de reactivación.");

        return self::SUCCESS;
    }
}

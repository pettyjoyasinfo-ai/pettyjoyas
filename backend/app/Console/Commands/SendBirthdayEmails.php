<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\EmailFlow;
use App\Support\Mailer;
use Illuminate\Console\Command;

class SendBirthdayEmails extends Command
{
    protected $signature   = 'emails:send-birthdays';
    protected $description = 'Envía emails de cumpleaños a clientes que cumplen en 7 días';

    public function handle(): int
    {
        $flow = EmailFlow::where('trigger', 'birthday')->first();

        if (! $flow || ! $flow->active) {
            $this->info('Flujo de cumpleaños inactivo — sin envíos.');
            return self::SUCCESS;
        }

        $target = now()->addDays(7);

        $customers = Customer::whereNotNull('email')
            ->whereNotNull('birthday')
            ->whereMonth('birthday', $target->month)
            ->whereDay('birthday', $target->day)
            ->get();

        if ($customers->isEmpty()) {
            $this->info('Sin cumpleaños en 7 días.');
            return self::SUCCESS;
        }

        foreach ($customers as $customer) {
            Mailer::birthdayWish($customer, $flow);
        }

        $flow->increment('sent_count', $customers->count());

        $this->info("Enviados {$customers->count()} emails de cumpleaños.");

        return self::SUCCESS;
    }
}

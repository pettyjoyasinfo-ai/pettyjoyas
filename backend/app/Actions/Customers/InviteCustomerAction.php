<?php

namespace App\Actions\Customers;

use App\Models\Customer;
use App\Models\CustomerInvitation;
use App\Support\Mailer;
use Illuminate\Support\Str;

class InviteCustomerAction
{
    public function execute(Customer $customer): void
    {
        if (! $customer->email) return;

        $token = Str::random(64);

        CustomerInvitation::updateOrCreate(
            ['email' => $customer->email],
            ['token' => $token, 'expires_at' => now()->addDays(7)],
        );

        Mailer::customerInvitation($customer, $token);
    }
}

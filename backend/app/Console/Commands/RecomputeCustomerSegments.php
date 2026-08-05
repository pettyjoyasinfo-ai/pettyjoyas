<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Services\Customers\CustomerService;
use Illuminate\Console\Command;

class RecomputeCustomerSegments extends Command
{
    protected $signature = 'customers:recompute-segments';

    protected $description = 'Recalcula el segmento (nuevo/recurrente/inactivo) de todos los clientes según su comportamiento. El VIP manual no se toca.';

    public function handle(CustomerService $customers): int
    {
        $total = 0;

        Customer::query()->chunkById(200, function ($batch) use ($customers, &$total) {
            foreach ($batch as $customer) {
                $customers->recomputeSegment($customer);
                $total++;
            }
        });

        $this->info("Segmentos recalculados: {$total} clientes.");

        return self::SUCCESS;
    }
}

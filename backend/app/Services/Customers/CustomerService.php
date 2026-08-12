<?php

namespace App\Services\Customers;

use App\Enums\CustomerSegment;
use App\Models\Customer;

class CustomerService
{
    /**
     * Vincula o crea un cliente por email (historial unificado físico + online).
     * Devuelve null si no se aportó email ni datos.
     */
    public function resolveByEmail(?array $data): ?Customer
    {
        if (! $data) {
            return null;
        }

        $email = $data['email'] ?? null;
        if ($email) {
            $customer = Customer::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $data['name'] ?? 'Cliente',
                    'phone' => $data['phone'] ?? null,
                    'document' => $data['document'] ?? null,
                    'segment' => CustomerSegment::Nuevo,
                ],
            );

            // Si ya existía (cliente recurrente) y todavía no tenía DNI cargado,
            // se lo completa con el que acaba de dar — sin pisar uno que ya
            // esté guardado, por si hay una diferencia real que revisar a mano.
            if (! empty($data['document']) && empty($customer->document)) {
                $customer->update(['document' => $data['document']]);
            }

            return $customer;
        }

        if (! empty($data['name'])) {
            return Customer::create([
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'document' => $data['document'] ?? null,
                'segment' => CustomerSegment::Nuevo,
            ]);
        }

        return null;
    }

    /**
     * Recalcula el segmento según comportamiento (no pisa el VIP manual).
     */
    public function recomputeSegment(Customer $customer): void
    {
        if ($customer->vip) {
            $customer->update(['segment' => CustomerSegment::Vip]);
            return;
        }

        $orders = $customer->orders()->count();
        $last = $customer->orders()->latest()->value('created_at');
        $inactive = $last && $last->lt(now()->subDays(90));

        $segment = match (true) {
            $inactive => CustomerSegment::Inactivo,
            $orders >= 3 => CustomerSegment::Recurrente,
            default => CustomerSegment::Nuevo,
        };

        $customer->update(['segment' => $segment]);
    }
}

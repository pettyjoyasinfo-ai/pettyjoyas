<?php

namespace App\Actions\Sales;

use App\Models\Order;

/**
 * Corrige el medio de pago y/o el monto de una venta presencial (POS) ya
 * cargada — para cuando el cajero se equivoca al cobrar. Solo aplica a
 * channel=local: los tres métodos de POS (efectivo/tarjeta/transferencia) ya
 * quedan "pagado" de una (ver CreateSaleAction), así que cambiar entre ellos
 * no requiere tocar status/payment_status, solo sincronizar el Payment.
 *
 * No toca items ni stock: es una corrección del monto/medio registrado, no
 * un cambio de qué se vendió.
 */
class EditSaleAction
{
    public function execute(Order $order, ?string $paymentMethod, ?int $total): Order
    {
        $data = array_filter([
            'payment_method' => $paymentMethod,
            'total' => $total,
        ], fn ($v) => $v !== null);

        if ($data) {
            $order->update($data);
        }

        $payment = $order->payments()->latest()->first();
        if ($payment) {
            $payment->update(array_filter([
                'provider' => $paymentMethod,
                'amount' => $total,
            ], fn ($v) => $v !== null));
        }

        return $order->fresh(['customer', 'items', 'payments']);
    }
}

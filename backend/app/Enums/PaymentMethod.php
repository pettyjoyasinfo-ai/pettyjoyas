<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case MercadoPago = 'mercadopago';
    case Transferencia = 'transferencia';
    case Efectivo = 'efectivo';
    case TarjetaCredito = 'tarjeta_credito';
}

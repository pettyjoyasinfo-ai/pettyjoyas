<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pendiente = 'pendiente';
    case Aprobado = 'aprobado';
    case Rechazado = 'rechazado';
}

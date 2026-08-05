<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pendiente   = 'pendiente';
    case Reserva     = 'reserva';    // efectivo + retiro en local: esperando que el cliente pase
    case Pagado      = 'pagado';
    case Preparacion = 'preparacion';
    case Enviado     = 'enviado';
    case Entregado   = 'entregado';
    case Cancelado   = 'cancelado';
}

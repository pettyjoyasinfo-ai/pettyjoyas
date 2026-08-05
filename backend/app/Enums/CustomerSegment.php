<?php

namespace App\Enums;

enum CustomerSegment: string
{
    case Nuevo = 'nuevo';
    case Recurrente = 'recurrente';
    case Vip = 'vip';
    case Inactivo = 'inactivo';
}

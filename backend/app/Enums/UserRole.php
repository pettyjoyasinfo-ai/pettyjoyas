<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Vendedor = 'vendedor';
    case Cliente = 'cliente';
}

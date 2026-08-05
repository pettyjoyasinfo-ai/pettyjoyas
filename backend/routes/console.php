<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recalcula la segmentación de clientes cada día (marca inactivos a los 90 días
// sin comprar, recurrentes a las 3 compras, etc.). El VIP manual no se toca.
Schedule::command('customers:recompute-segments')->dailyAt('03:00');

// Envía emails de cumpleaños a clientes que cumplen en 7 días (si el flujo está activo).
Schedule::command('emails:send-birthdays')->dailyAt('08:00');

// Carrito abandonado: corre cada hora y notifica carts con ítems abandonados 1–24 h antes.
Schedule::command('emails:send-abandoned-carts')->hourly();

// Post-compra: corre a diario y envía consejos a clientes cuyos pedidos se entregaron hace ~3 días.
Schedule::command('emails:send-post-purchase')->dailyAt('10:00');

// Reactivación: corre a diario y envía oferta a clientes inactivos 90+ días sin compras recientes.
Schedule::command('emails:send-reactivation')->dailyAt('11:00');

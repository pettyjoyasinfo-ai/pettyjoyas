<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeInterface;

/**
 * Hora del negocio (Argentina).
 *
 * Laravel y la base trabajan en UTC (config/app.php): los `created_at` se guardan en UTC y
 * eso NO se cambia, porque cambiar la zona de la app correría 3 horas todo lo ya guardado.
 * Cuando el servidor tiene que mostrar una hora o calcular "el día de hoy", hay que pasar
 * por acá; si no, la hora sale 3 horas adelantada y el "día" cambia a las 21:00 locales.
 *
 * Argentina no usa horario de verano, así que el desfase es siempre de -3 h.
 */
final class BusinessTime
{
    public const TZ = 'America/Argentina/Buenos_Aires';

    /** Hora local del negocio, lista para mostrar (ej. en mails). Cadena vacía si no hay fecha. */
    public static function format(DateTimeInterface|string|null $dt, string $format = 'd/m/Y H:i'): string
    {
        if ($dt === null || $dt === '') {
            return '';
        }

        // Una cadena sin zona es un valor de la base: está en UTC.
        return CarbonImmutable::parse($dt, 'UTC')->setTimezone(self::TZ)->format($format);
    }

    /**
     * Inicio del día argentino de una fecha (AAAA-MM-DD). Devuelve la hora local; para
     * filtrar la base hay que pasarla a UTC con ->utc(). Null si la fecha no es válida.
     */
    public static function startOfDay(string $date): ?CarbonImmutable
    {
        try {
            return CarbonImmutable::parse($date, self::TZ)->setTimezone(self::TZ)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    /** Fin del día argentino de una fecha (AAAA-MM-DD). Ver startOfDay(). */
    public static function endOfDay(string $date): ?CarbonImmutable
    {
        return self::startOfDay($date)?->endOfDay();
    }
}

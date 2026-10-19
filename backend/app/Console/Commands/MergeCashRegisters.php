<?php

namespace App\Console\Commands;

use App\Models\CashRegister;
use App\Models\CreditNote;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MergeCashRegisters extends Command
{
    protected $signature = 'pos:merge-registers
        {date : Día en hora argentina (AAAA-MM-DD)}
        {--dry-run : Solo muestra qué se uniría, sin cambiar nada}';

    protected $description = 'Une en una sola las cajas que se abrieron y cerraron el mismo día (hora argentina). Los cierres intermedios quedan anotados en las notas.';

    public function handle(): int
    {
        $tz = CashRegister::TZ;

        try {
            $day = Carbon::createFromFormat('!Y-m-d', (string) $this->argument('date'), $tz);
        } catch (\Throwable) {
            $this->error('Fecha inválida. Usá el formato AAAA-MM-DD, por ejemplo 2026-10-17.');

            return self::INVALID;
        }

        $from = $day->copy()->startOfDay();
        $to = $day->copy()->endOfDay();

        // Solo cajas abiertas Y cerradas dentro de ese día: una que cruza la medianoche
        // (o sigue abierta) no se toca, porque mezclaría ventas de otro día.
        $regs = CashRegister::where('status', 'closed')
            ->orderBy('opened_at')
            ->get()
            ->filter(fn (CashRegister $r) => $r->closed_at
                && $r->opened_at->copy()->setTimezone($tz)->between($from, $to)
                && $r->closed_at->copy()->setTimezone($tz)->between($from, $to))
            ->values();

        if ($regs->count() < 2) {
            $this->info("Nada para unir el {$day->toDateString()}: hay {$regs->count()} caja(s) abierta(s) y cerrada(s) ese día.");

            return self::SUCCESS;
        }

        $money = fn (?int $n) => $n === null ? 'sin conteo' : '$'.number_format($n, 0, ',', '.');
        $hora = fn ($dt) => $dt->copy()->setTimezone($tz)->format('H:i');

        $this->line("Cajas del {$day->toDateString()} que se unirían:");
        foreach ($regs as $r) {
            $s = $r->salesSummary();
            $this->line(sprintf(
                '  #%d  %s → %s  apertura %s  contado %s  esperado %s  ventas %d (%s)',
                $r->id, $hora($r->opened_at), $hora($r->closed_at),
                $money($r->opening_amount), $money($r->closing_amount), $money($r->expected_cash),
                $s['count'], $money($s['total']),
            ));
        }

        $keep = $regs->first();
        $last = $regs->last();

        // Cómo quedaría la caja unificada (ventana: apertura de la primera → cierre de la última).
        $probe = $keep->replicate();
        $probe->opened_at = $keep->opened_at;
        $probe->closed_at = $last->closed_at;
        $after = $probe->salesSummary();
        $this->line(sprintf(
            'Quedaría 1 caja (#%d): %s → %s · %d ventas · %s (efectivo %s, transferencia %s, tarjeta %s)',
            $keep->id, $hora($keep->opened_at), $hora($last->closed_at), $after['count'], $money($after['total']),
            $money($after['efectivo']['total']), $money($after['transferencia']['total']), $money($after['tarjeta']['total']),
        ));

        if ($this->option('dry-run')) {
            $this->warn('Simulación: no se cambió nada.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($regs, $keep, $last, $hora, $money) {
            $others = $regs->slice(1);

            // Notas originales (sin repetir) + cada cierre intermedio, para no perder el rastro
            // de lo que se contó a mitad de día.
            $notes = $regs->pluck('notes')->filter()
                ->flatMap(fn ($n) => preg_split('/\R/', (string) $n))
                ->map(fn ($l) => trim($l))->filter()->unique()->values();
            $audit = $regs->slice(0, -1)->map(fn (CashRegister $r) => sprintf(
                'Cierre intermedio %s (caja #%d): contado %s · esperado %s',
                $hora($r->closed_at), $r->id, $money($r->closing_amount), $money($r->expected_cash),
            ));
            $ids = $regs->pluck('id')->map(fn ($i) => "#{$i}")->implode(', ');

            $keep->update([
                'closed_at'      => $last->closed_at,
                'closed_by'      => $last->closed_by,
                'closing_amount' => $last->closing_amount,
                'notes'          => $notes->concat($audit)->push("Unificada: {$regs->count()} cajas del día ({$ids})")->implode("\n"),
            ]);

            CreditNote::whereIn('cash_register_id', $others->pluck('id'))->update(['cash_register_id' => $keep->id]);
            CashRegister::whereIn('id', $others->pluck('id'))->delete();

            $summary = $keep->fresh()->salesSummary();
            $keep->update(['expected_cash' => $keep->opening_amount + $summary['efectivo']['total']]);
        });

        $this->info("Listo: {$regs->count()} cajas unidas en la #{$keep->id}.");

        return self::SUCCESS;
    }
}

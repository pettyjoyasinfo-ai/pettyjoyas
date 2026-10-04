import { Flor, Petalo } from "@/components/ui/flor";

// left %, delay s, duración s, tamaño px — repartidos para que no parezca un patrón
const PETALOS = [
  { left: 6, delay: 0, dur: 14, size: 16 },
  { left: 17, delay: 5, dur: 17, size: 12 },
  { left: 29, delay: 2, dur: 15, size: 18 },
  { left: 41, delay: 9, dur: 18, size: 13 },
  { left: 53, delay: 4, dur: 14, size: 15 },
  { left: 64, delay: 11, dur: 16, size: 11 },
  { left: 76, delay: 1, dur: 19, size: 17 },
  { left: 88, delay: 7, dur: 15, size: 13 },
  { left: 95, delay: 12, dur: 17, size: 15 },
];

/**
 * Decoración de "Octubre Rosa" para el hero: flores grandes en las esquinas y una
 * lluvia suave de pétalos. Solo se ve cuando el tema rosa está activo (ver
 * `.tema-rosa-only` en globals.css); fuera de octubre no ocupa nada.
 */
export function MesRosaHero() {
  return (
    <div className="tema-rosa-only pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <Flor className="flor-giro absolute -left-14 -top-14 h-52 w-52 text-white/25 sm:-left-20 sm:-top-20 sm:h-80 sm:w-80" />
      <Flor className="flor-giro-inv absolute -right-10 top-24 h-36 w-36 text-white/25 sm:-bottom-24 sm:-right-16 sm:top-auto sm:h-96 sm:w-96" />
      <Flor className="absolute left-[8%] top-[58%] hidden h-14 w-14 text-white/40 sm:block" />
      <Flor className="absolute right-[10%] top-[12%] hidden h-10 w-10 text-white/45 sm:block" />

      {PETALOS.map((p, i) => (
        <Petalo
          key={i}
          className="petalo-cae absolute -top-8 text-white/70"
          style={{ left: `${p.left}%`, width: p.size, animationDelay: `-${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}
    </div>
  );
}

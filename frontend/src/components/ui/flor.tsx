import { cn } from "@/lib/utils";

/**
 * Flor de cerezo (5 pétalos con muesca). Se pinta con `currentColor`, así que el
 * color lo define quien la usa (`text-brand-300`, `text-white/30`, etc.).
 */
export function Flor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("shrink-0", className)}>
      <g transform="translate(50 50)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path
              d="M0,-5 C-19,-14 -24,-41 -6,-48 L0,-43 L6,-48 C24,-41 19,-14 0,-5Z"
              fill="currentColor"
            />
            {/* nervadura central, para que no sea una mancha plana */}
            <path d="M0,-9 L0,-35" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        ))}
        <circle r="7.5" fill="#fff" fillOpacity="0.55" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <circle
            key={deg}
            cx="0"
            cy="-12"
            r="2.2"
            fill="#e0a64f"
            transform={`rotate(${deg + 36})`}
          />
        ))}
        <circle r="3.4" fill="#e0a64f" />
      </g>
    </svg>
  );
}

/** Pétalo suelto para la lluvia de pétalos del hero. */
export function Petalo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 28" aria-hidden="true" className={className} style={style}>
      <path d="M10,27 C-4,20 -3,5 6,1 L10,5 L14,1 C23,5 24,20 10,27Z" fill="currentColor" />
    </svg>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de carga superior que se anima en cada navegación entre páginas.
 * Da feedback visual de "acción en curso" en todo el sistema.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setWidth(12);
    const t1 = setTimeout(() => setWidth(72), 60);
    const t2 = setTimeout(() => setWidth(100), 280);
    const t3 = setTimeout(() => setVisible(false), 560);
    const t4 = setTimeout(() => setWidth(0), 760);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-brand to-gold transition-[width,opacity] duration-200 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

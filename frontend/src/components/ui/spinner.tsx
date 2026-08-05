import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Spinner reutilizable para estados de carga en botones y secciones. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

/** Pantalla de carga centrada (para loading.tsx o cargas a pantalla completa). */
export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted">
      <Spinner className="h-8 w-8 text-brand" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

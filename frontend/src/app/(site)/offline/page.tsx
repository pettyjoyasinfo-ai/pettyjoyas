import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <div className="container-px flex flex-col items-center py-28 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-stone-bg text-muted">
        <WifiOff className="h-9 w-9" />
      </span>
      <h1 className="mt-6 font-display text-4xl text-ink">Estás sin conexión</h1>
      <p className="mt-3 max-w-md text-body">
        No pudimos cargar esta página. Revisá tu conexión a internet. Las páginas que ya
        visitaste siguen disponibles offline.
      </p>
      <Link href="/" className="btn-brand mt-7">
        Volver al inicio
      </Link>
    </div>
  );
}

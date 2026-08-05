import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-px flex flex-col items-center py-32 text-center">
      <span className="font-display text-8xl text-khaki-300">404</span>
      <h1 className="mt-4 font-display text-3xl text-ink">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-body">
        La página que buscás no existe o fue movida. Volvé al inicio o seguí explorando la
        tienda.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="btn-brand">
          Inicio
        </Link>
        <Link href="/tienda" className="btn-outline">
          Ir a la tienda
        </Link>
      </div>
    </div>
  );
}

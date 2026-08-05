import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Cuidado de tus joyas",
  description: "Consejos para mantener tus joyas como el primer día.",
};

export default function CuidadosPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Cuidado de tus joyas" }]} />
      <article className="mx-auto mt-8 max-w-2xl">
        <h1 className="font-display text-4xl text-ink">Cuidado de tus joyas</h1>
        <p className="mt-3 text-body">
          Con algunos cuidados simples, tus joyas se mantienen brillantes por mucho tiempo.
        </p>
        <ul className="mt-5 list-disc space-y-2.5 pl-5 text-body">
          <li>Quitátelas antes de bañarte, nadar o hacer ejercicio.</li>
          <li>Evitá el contacto con perfumes, cremas y productos de limpieza.</li>
          <li>Guardalas por separado en un lugar seco, idealmente en su estuche.</li>
          <li>Limpiá la plata con un paño suave; si se oscurece, usá un limpiador específico.</li>
          <li>Las piezas con baño de oro no deben frotarse en exceso para preservar el baño.</li>
        </ul>
        <p className="mt-5 text-body">
          Todas nuestras piezas tienen garantía de por vida en el armado. Ante cualquier
          inconveniente, escribinos.
        </p>
      </article>
    </div>
  );
}

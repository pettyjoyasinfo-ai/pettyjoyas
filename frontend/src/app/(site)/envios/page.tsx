import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Información sobre envíos, plazos y cambios en Petty Joyas.",
};

export default function EnviosPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Envíos y devoluciones" }]} />
      <article className="mx-auto mt-8 max-w-2xl">
        <h1 className="font-display text-4xl text-ink">Envíos y devoluciones</h1>

        <h2 className="mt-8 font-display text-2xl text-ink">Envíos</h2>
        <p className="mt-3 text-body">
          Realizamos envíos a todo el país a través de Correo Argentino y Andreani. El costo
          no se cobra en el checkout: te contactamos por WhatsApp o email después de la
          compra para coordinar el envío y su costo según tu ubicación.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body">
          <li>CABA y GBA: 2 a 4 días hábiles.</li>
          <li>Interior del país: 4 a 7 días hábiles.</li>
          <li>Retiro en local sin costo ({SITE.address}).</li>
        </ul>

        <h2 className="mt-8 font-display text-2xl text-ink">Cambios y devoluciones</h2>
        <p className="mt-3 text-body">
          Tenés 30 días desde la recepción para solicitar un cambio. El producto debe estar
          sin uso y en su empaque original. Los gastos de envío del cambio corren por cuenta
          del cliente, salvo error nuestro o falla de fábrica.
        </p>
        <p className="mt-3 text-body">
          Por razones de higiene, los aros tipo abridor no admiten cambio. Las piezas
          personalizadas (grabados, iniciales) no tienen cambio ni devolución.
        </p>
      </article>
    </div>
  );
}

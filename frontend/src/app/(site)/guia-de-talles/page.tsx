import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Guía de talles",
  description: "Cómo medir tu talle de anillo y el largo de cadena ideal.",
};

const RING_TABLE = [
  ["12", "51.8"],
  ["14", "54.4"],
  ["16", "57.0"],
  ["18", "59.5"],
  ["20", "62.1"],
  ["22", "64.6"],
];

export default function GuiaTallesPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Guía de talles" }]} />
      <article className="mx-auto mt-8 max-w-2xl">
        <h1 className="font-display text-4xl text-ink">Guía de talles</h1>

        <h2 className="mt-8 font-display text-2xl text-ink">Talle de anillo</h2>
        <p className="mt-3 text-body">
          Medí el contorno de tu dedo con un hilo o una tira de papel y compará el largo en
          milímetros con la tabla. Si estás entre dos talles, elegí el mayor.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-stone-bg text-ink">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Talle (AR)</th>
                <th className="px-4 py-3 text-left font-semibold">Contorno (mm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {RING_TABLE.map(([talle, mm]) => (
                <tr key={talle}>
                  <td className="px-4 py-2.5 text-ink">{talle}</td>
                  <td className="px-4 py-2.5 text-body">{mm} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 font-display text-2xl text-ink">Largo de cadena</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body">
          <li><strong>40 cm:</strong> gargantilla, queda sobre la clavícula.</li>
          <li><strong>45 cm:</strong> el más versátil, cae bajo la clavícula.</li>
          <li><strong>50 cm:</strong> ideal para usar en capas.</li>
        </ul>
        <p className="mt-4 text-body">
          ¿Tenés dudas? Escribinos y te ayudamos a elegir el talle perfecto.
        </p>
      </article>
    </div>
  );
}

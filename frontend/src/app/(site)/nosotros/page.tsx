"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem, Heart, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePublicSettings } from "@/lib/api/admin";

const VALUES = [
  {
    icon: Gem,
    title: "Calidad real",
    text: "Seleccionamos materiales nobles y revisamos cada pieza para que dure toda la vida.",
  },
  {
    icon: Heart,
    title: "Para cada momento",
    text: "Desde lo cotidiano hasta el regalo más especial. Tenemos la joya perfecta para cada ocasión.",
  },
  {
    icon: Sparkles,
    title: "Variedad para elegir",
    text: "Piezas para cada estilo y ocasión, para vos o para regalar.",
  },
];

const DEFAULT_NOSOTROS = {
  eyebrow: "Nuestra historia",
  title: "Joyas que cuentan historias",
  paragraphs: [
    "Petty Joyas es una joyería con base en Puerto Iguazú y más de 30 años de trayectoria. Creemos que una joya no es solo un accesorio: es un recuerdo, un regalo, una forma de expresar quién sos.",
    "Seleccionamos piezas de calidad en oro y plata para que siempre encuentres algo que te represente, ya sea para vos o para regalar.",
  ],
  image: "/assets/img/about/about-1.jpg",
};

export default function NosotrosPage() {
  const { data: settings } = usePublicSettings();
  const n = settings?.nosotros
    ? { ...DEFAULT_NOSOTROS, ...settings.nosotros }
    : DEFAULT_NOSOTROS;

  return (
    <div>
      <div className="container-px py-8">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Nosotros" }]} />
      </div>

      {/* Hero */}
      <section className="container-px grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-2">
        <div>
          <span className="section-subtitle">{n.eyebrow}</span>
          <h1 className="mt-4 font-display text-5xl leading-tight text-ink">
            {n.title}
          </h1>
          {(n.paragraphs as string[]).map((p: string, i: number) => (
            <p key={i} className="mt-4 text-body first:mt-5">
              {p}
            </p>
          ))}
          <Link href="/tienda" className="btn-brand mt-7 inline-flex">
            Ver la colección
          </Link>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-bg">
          <Image
            src={n.image}
            alt="Taller de Petty Joyas"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Valores */}
      <section className="container-px py-16">
        <SectionHeading eyebrow="Lo que nos define" title="Nuestros valores" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line p-7 text-center">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-khaki-100 text-brand">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-xl text-ink">{title}</h3>
              <p className="mt-2 text-sm text-body">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-px pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl">
            ¿Lista para encontrar tu joya?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Explorá nuestra colección y encontrá la pieza perfecta para vos o para regalar.
          </p>
          <Link href="/tienda" className="btn-gold mt-7 inline-flex">
            Ir a la tienda
          </Link>
        </div>
      </section>
    </div>
  );
}

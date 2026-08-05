import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEFAULT_SETTINGS, type AboutSettings } from "@/lib/data/settings";

export function About({ data }: { data?: AboutSettings }) {
  const about = data ?? DEFAULT_SETTINGS.about;

  return (
    <section className="container-px py-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Imágenes superpuestas */}
        <div className="relative">
          <div className="relative aspect-[4/5] w-4/5 overflow-hidden rounded-3xl bg-stone-bg">
            <Image
              src={about.image1}
              alt="Taller de Petty Joyas"
              fill
              sizes="(max-width: 1024px) 80vw, 35vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 aspect-square w-1/2 overflow-hidden rounded-3xl border-[6px] border-white bg-stone-bg shadow-xl">
            <Image
              src={about.image2}
              alt="Detalle de una pieza"
              fill
              sizes="(max-width: 1024px) 40vw, 18vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Texto */}
        <div className="lg:pl-8">
          <span className="section-subtitle">{about.eyebrow}</span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {about.title}
          </h2>
          {about.paragraphs.map((p, i) => (
            <p key={i} className="mt-4 max-w-md text-body first:mt-5">
              {p}
            </p>
          ))}
          <Link href={about.ctaHref} className="btn-primary mt-8 inline-flex">
            {about.ctaText} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ContactForm } from "@/components/contact/contact-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos: estamos para ayudarte a elegir tu joya ideal.",
};

export default function ContactoPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]} />

      <header className="mt-6 mb-10 max-w-xl">
        <span className="section-subtitle">Estamos para ayudarte</span>
        <h1 className="mt-3 font-display text-4xl text-ink">Contacto</h1>
        <p className="mt-2 text-body">
          ¿Tenés una consulta sobre un producto o un pedido?
          Escribinos y te respondemos a la brevedad.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
        <ContactForm />

        <aside className="flex flex-col gap-4">
          <InfoCard icon={<MapPin className="h-5 w-5" />} title="Local" text={SITE.address} />
          <InfoCard
            icon={<Phone className="h-5 w-5" />}
            title="Teléfono"
            text={SITE.phone}
            href={`tel:${SITE.phone}`}
          />
          <InfoCard
            icon={<Mail className="h-5 w-5" />}
            title="Email"
            text={SITE.email}
            href={`mailto:${SITE.email}`}
          />
          <InfoCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="WhatsApp"
            text="Escribinos por WhatsApp"
            href={`https://wa.me/${SITE.whatsapp}`}
          />
          <div className="rounded-2xl bg-khaki-100 p-5">
            <p className="font-display text-lg text-ink">Horario de atención</p>
            <p className="mt-1 text-sm text-body">{SITE.schedule}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3.5 rounded-2xl border border-line p-5 transition hover:border-brand">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-bg text-brand">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-body">{text}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}

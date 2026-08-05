import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { FaqGroup } from "@/components/ui/faq-accordion";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ayuda · Preguntas frecuentes",
  description: "Respondemos las dudas más comunes sobre pedidos, envíos, pagos, cambios y cuidado de tus joyas.",
};

const FAQS: FaqGroup[] = [
  {
    title: "Pedidos y envíos",
    items: [
      {
        q: "¿A dónde realizan envíos?",
        a: `Enviamos a todo el territorio argentino a través de Correo Argentino y Andreani. También podés retirar tu pedido sin costo en nuestro local de ${SITE.address}, ${SITE.schedule}.`,
      },
      {
        q: "¿Cuánto demora el envío?",
        a: "Para CABA y GBA el plazo es de 2 a 4 días hábiles. Para el interior del país, de 4 a 7 días hábiles. Una vez despachado el pedido, te enviamos el número de seguimiento por correo electrónico.",
      },
      {
        q: "¿Cómo obtengo envío gratis?",
        a: "Todas las compras iguales o superiores a $80.000 tienen envío gratis a todo el país. El descuento se aplica automáticamente en el checkout al superar ese monto.",
      },
      {
        q: "¿Cómo hago el seguimiento de mi pedido?",
        a: "Una vez que tu pedido es despachado, recibís un correo con el número de seguimiento y el enlace al sitio del transporte. También podés consultarlo en la sección Mi cuenta → Mis pedidos.",
      },
      {
        q: "¿Puedo modificar la dirección de entrega después de comprar?",
        a: "Si el pedido todavía no fue despachado, podés escribirnos por WhatsApp o mail y lo modificamos sin problema. Una vez que está en camino, no es posible hacer cambios.",
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        q: "¿Qué medios de pago aceptan?",
        a: "Aceptamos MercadoPago (tarjetas de crédito y débito, billetera virtual), transferencia bancaria/CVU y efectivo en el local. Para pagos online podés usar Visa, Mastercard, American Express y todas las billeteras digitales.",
      },
      {
        q: "¿Es seguro comprar en la tienda online?",
        a: "Sí. Los pagos online se procesan a través de MercadoPago, que cuenta con encriptación SSL y cumple con los estándares de seguridad PCI-DSS. Nosotros nunca almacenamos los datos de tu tarjeta.",
      },
      {
        q: "¿Puedo pagar en efectivo?",
        a: "El pago en efectivo está disponible únicamente para compras y retiros en nuestro local físico. Las compras online requieren pago digital (MercadoPago o transferencia).",
      },
      {
        q: "¿Cuándo se acredita una transferencia?",
        a: "Las transferencias se acreditan en el momento (transferencias inmediatas CBU/CVU). En cuanto verificamos el pago, preparamos tu pedido. Si hacés la transferencia fuera del horario bancario, puede demorar hasta el día hábil siguiente.",
      },
    ],
  },
  {
    title: "Cambios y devoluciones",
    items: [
      {
        q: "¿Cuánto tiempo tengo para solicitar un cambio?",
        a: "Tenés 30 días corridos desde que recibís tu pedido para solicitar un cambio. El producto debe estar sin uso, con sus etiquetas y en su embalaje original.",
      },
      {
        q: "¿Qué productos no admiten cambio ni devolución?",
        a: "Por razones de higiene, los aros tipo abridor no tienen cambio. Las piezas personalizadas (con grabado, iniciales o por encargo) tampoco admiten cambio ni devolución, salvo defecto de fabricación.",
      },
      {
        q: "¿Cómo inicio un proceso de cambio?",
        a: `Escribinos por WhatsApp o a ${SITE.email} con tu número de pedido y una foto del producto. Te explicamos los pasos. El costo del envío de devolución corre por cuenta del cliente, salvo que sea un error nuestro o una falla de fábrica.`,
      },
      {
        q: "¿Qué pasa si recibo un producto con defecto?",
        a: "Si el producto llega con algún defecto de fabricación o diferente a lo mostrado, cubrimos el envío de devolución y te enviamos una pieza nueva sin costo adicional. Tenés que contactarnos dentro de los 7 días de recibido el pedido.",
      },
    ],
  },
  {
    title: "Productos y materiales",
    items: [
      {
        q: "¿Qué significa \"bañado en oro\"?",
        a: "Las piezas bañadas en oro tienen una base de bronce o plata con un recubrimiento de oro de alta pureza (18k o 24k) aplicado mediante un proceso electroquímico. Son más accesibles que el oro macizo y lucen igual de hermosas.",
      },
      {
        q: "¿Las joyas son hipoalergénicas?",
        a: "Nuestras piezas de Plata 925 y las bañadas en oro son aptas para pieles sensibles en la mayoría de los casos. Si tenés alergia al níquel, te recomendamos optar por las piezas de Plata 925 pura. Ante cualquier duda, consultanos antes de comprar.",
      },
      {
        q: "¿Puedo usar las joyas en la ducha, pileta o el mar?",
        a: "No recomendamos exponer las piezas al agua de manera prolongada, ni al cloro ni al agua salada. El contacto frecuente con agua, perfumes y cremas acorta la vida del baño. Para las piezas de Plata 925 sin baño, el contacto breve con agua no es problema.",
      },
      {
        q: "¿Cuánto dura el baño de oro?",
        a: "Con el cuidado adecuado (guardando las piezas en una bolsita hermética, evitando el agua, los perfumes y el sudor excesivo) el baño puede durar años. El desgaste depende del uso diario y del cuidado que le des a cada pieza.",
      },
      {
        q: "¿Las joyas tienen garantía?",
        a: "Sí. Todas nuestras piezas tienen garantía de por vida en el armado: si una pieza se rompe por un defecto de construcción (soldaduras, cierres, engarces), la reparamos o reponemos sin costo. El desgaste natural del baño no está incluido en la garantía.",
      },
    ],
  },
  {
    title: "Mi cuenta",
    items: [
      {
        q: "¿Para qué sirve crear una cuenta?",
        a: "Con tu cuenta podés hacer seguimiento de tus pedidos, guardar tus joyas favoritas, acceder a cupones exclusivos y completar el checkout más rápido sin tener que ingresar tus datos cada vez.",
      },
      {
        q: "¿Qué hago si olvidé mi contraseña?",
        a: "En la pantalla de inicio de sesión hacé clic en «¿Olvidaste tu contraseña?». Te enviamos un código de recuperación al mail registrado. Si no lo encontrás, revisá la carpeta de spam.",
      },
      {
        q: "¿Puedo comprar sin crear una cuenta?",
        a: "Sí, podés comprar como invitado. Sin embargo, con una cuenta podés ver el historial de tus pedidos y acceder a beneficios exclusivos para clientes registrados.",
      },
    ],
  },
];

export default function AyudaPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Preguntas frecuentes" }]} />

      <div className="mx-auto mt-8 max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="section-subtitle">Centro de ayuda</span>
          <h1 className="mt-4 font-display text-5xl text-ink">
            Preguntas frecuentes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-body">
            Encontrá respuesta a las dudas más comunes. Si no encontrás lo que
            buscás, escribinos sin problema.
          </p>
        </div>

        {/* Acordeón */}
        <FaqAccordion groups={FAQS} />

        {/* CTA contacto */}
        <div className="mt-16 rounded-3xl bg-stone-bg p-10 text-center">
          <h2 className="font-display text-2xl text-ink">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="mt-2 text-sm text-body">
            Estamos para ayudarte {SITE.schedule}.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-[#25D366] px-6 py-3 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
            <Link
              href="/contacto"
              className="flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              <Mail className="h-4 w-4" />
              Enviar un mensaje
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

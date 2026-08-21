import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Políticas y privacidad",
  description: "Política de privacidad y términos y condiciones de Petty Joyas.",
};

export default function PoliticasPage() {
  return (
    <div className="container-px py-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Políticas y privacidad" }]} />
      <article className="mx-auto mt-8 max-w-2xl">
        <h1 className="font-display text-4xl text-ink">Políticas y privacidad</h1>
        <p className="mt-3 text-sm text-muted">Última actualización: julio de 2026.</p>

        <h2 className="mt-10 font-display text-2xl text-ink">Política de privacidad</h2>

        <h3 className="mt-6 text-base font-semibold text-ink">Qué datos recopilamos</h3>
        <p className="mt-3 text-body">
          Cuando comprás en {SITE.name} o creás una cuenta, recopilamos los datos necesarios
          para procesar tu pedido: nombre, email, teléfono y dirección de envío. Si iniciás
          sesión con Google, recibimos tu nombre y email de esa cuenta. No solicitamos ni
          almacenamos datos de tarjetas de crédito o débito: esa información la procesa
          directamente MercadoPago.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Para qué los usamos</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body">
          <li>Procesar y entregar tus pedidos, y comunicarte novedades sobre su estado.</li>
          <li>Responder tus consultas por el chat del sitio, WhatsApp o email.</li>
          <li>Enviarte novedades y descuentos por email, solo si te suscribiste al newsletter.</li>
          <li>Mejorar el catálogo y la experiencia de compra.</li>
        </ul>

        <h3 className="mt-6 text-base font-semibold text-ink">Con quién compartimos tus datos</h3>
        <p className="mt-3 text-body">
          No vendemos ni cedemos tus datos a terceros con fines comerciales. Los compartimos
          únicamente con los proveedores necesarios para operar la tienda: MercadoPago (pagos),
          las empresas de correo que usamos para el envío, y Google (si elegís iniciar sesión
          con esa opción).
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Cookies</h3>
        <p className="mt-3 text-body">
          Usamos cookies propias para mantener tu sesión, tu carrito de compras y tus
          preferencias mientras navegás. No usamos cookies de terceros con fines publicitarios.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Tus derechos</h3>
        <p className="mt-3 text-body">
          De acuerdo con la Ley 25.326 de Protección de Datos Personales, podés solicitar
          acceder, rectificar o eliminar tus datos personales en cualquier momento,
          escribiéndonos a{" "}
          <a href={`mailto:${SITE.email}`} className="text-brand underline-offset-2 hover:underline">
            {SITE.email}
          </a>. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de
          Control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos que
          interpongan quienes resulten afectados en sus derechos.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Términos y condiciones</h2>

        <h3 className="mt-6 text-base font-semibold text-ink">Uso del sitio</h3>
        <p className="mt-3 text-body">
          Al comprar o registrarte en {SITE.name} aceptás estos términos. Los precios,
          promociones y disponibilidad de stock pueden modificarse sin previo aviso. Nos
          reservamos el derecho de cancelar un pedido si detectamos un error de precio o de
          stock, avisándote y ofreciéndote el reembolso correspondiente.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Cambios y devoluciones</h3>
        <p className="mt-3 text-body">
          Una vez realizada la compra no se hacen reintegros de dinero, solo cambios. Consultá
          las condiciones en nuestra sección{" "}
          <a href="/envios" className="text-brand underline-offset-2 hover:underline">
            Envíos y devoluciones
          </a>.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Propiedad intelectual</h3>
        <p className="mt-3 text-body">
          Las imágenes, textos, logo y contenido de este sitio pertenecen a {SITE.name} y no
          pueden reproducirse sin autorización.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Cambios en estos términos</h3>
        <p className="mt-3 text-body">
          Podemos actualizar esta política ocasionalmente. Los cambios entran en vigencia al
          publicarse en esta misma página.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Contacto</h3>
        <p className="mt-3 text-body">
          Ante cualquier consulta sobre esta política, escribinos a{" "}
          <a href={`mailto:${SITE.email}`} className="text-brand underline-offset-2 hover:underline">
            {SITE.email}
          </a>{" "}
          o visitanos en {SITE.address}.
        </p>
      </article>
    </div>
  );
}

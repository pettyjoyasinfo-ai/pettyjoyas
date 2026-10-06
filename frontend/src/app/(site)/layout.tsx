import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chat-widget";
import { Announcement } from "@/components/layout/announcement";
import { RouteProgress } from "@/components/ui/route-progress";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { getCategories } from "@/lib/data/products";

/** Chrome de la tienda: anuncio, header, footer, carrito y chat. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Las mismas categorías que usa el footer (getCategories está cacheada por
  // render y en el Data Cache): el menú las recibe ya resueltas y el navegador
  // no tiene que pedirlas a la API. Si falla, el menú las pide como antes.
  const categories = await getCategories().catch(() => undefined);

  return (
    // .tema-scope acota el tema estacional (Octubre Rosa) a la tienda; el admin no se toca.
    <div className="tema-scope flex flex-1 flex-col">
      <MetaPixel />
      <RouteProgress />
      <Announcement />
      <SiteHeader initialCategories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}

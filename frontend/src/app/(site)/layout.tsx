import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chat-widget";
import { PromoFloating } from "@/components/shop/promo-strip";
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
    <>
      <MetaPixel />
      <RouteProgress />
      <Announcement />
      <SiteHeader initialCategories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <PromoFloating />
      <ChatWidget />
    </>
  );
}

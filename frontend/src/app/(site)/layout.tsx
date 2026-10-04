import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chat-widget";
import { Announcement } from "@/components/layout/announcement";
import { RouteProgress } from "@/components/ui/route-progress";
import { MetaPixel } from "@/components/analytics/meta-pixel";

/** Chrome de la tienda: anuncio, header, footer, carrito y chat. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // .tema-scope acota el tema estacional (Octubre Rosa) a la tienda; el admin no se toca.
    <div className="tema-scope flex flex-1 flex-col">
      <MetaPixel />
      <RouteProgress />
      <Announcement />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}

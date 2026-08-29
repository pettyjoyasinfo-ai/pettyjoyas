import { HeroSlider } from "@/components/home/hero-slider";
import { Features } from "@/components/home/features";
import { Banners } from "@/components/home/banners";
import { About } from "@/components/home/about";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductTabs } from "@/components/home/product-tabs";
import { CollectionSplit } from "@/components/home/collection-split";
import { BestSellers } from "@/components/home/best-sellers";
import { BrandsCarousel } from "@/components/home/brands-carousel";
import { Testimonials } from "@/components/home/testimonials";
import { InstagramFeed } from "@/components/home/instagram";
import {
  getCategories,
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";

// ISR como red de seguridad: /admin/configuracion (slides, banners, etc.) y
// guardar un producto ya avisan a /api/revalidate al instante (ver
// RevalidateFrontend), así que esto solo cubre el caso de que ese aviso
// falle. Antes estaba en 60s — sumado a las 800+ fichas de producto, eso
// generó muchísimas escrituras ISR (superó el límite mensual de Vercel).
export const revalidate = 3600;

export default async function HomePage() {
  const [categories, allProducts, bestSellers, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getFeaturedProducts(10),
    getSettings(),
  ]);

  const best = bestSellers.length >= 6 ? bestSellers : await getNewArrivals(10);

  return (
    <>
      <HeroSlider slides={settings.hero.slides} />
      <Features />
      <Banners items={settings.banners.items} />
      <About data={settings.about} />
      <CategoryGrid categories={categories} />
      <ProductTabs categories={categories} initialProducts={allProducts} />
      <CollectionSplit data={settings.collection} />
      <BestSellers products={best} />
      <BrandsCarousel data={settings.brands} />
      <Testimonials />
      <InstagramFeed urls={settings.instagram.urls} />
    </>
  );
}

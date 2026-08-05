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

// Sin esto, Next.js prerenderiza la home una sola vez en el build y los
// cambios de /admin/configuracion (slides, banners, etc.) no se ven hasta el
// próximo deploy. Con ISR, se revalida sola cada 60s sin perder el cacheo.
export const revalidate = 60;

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

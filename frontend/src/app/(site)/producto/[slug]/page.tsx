import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getProductBySlug,
  getRelatedProducts,
  getProducts,
} from "@/lib/data/products";
import { isApiConfigured } from "@/lib/api/client";

// ISR como red de seguridad, NO como mecanismo principal de frescura: cada
// vez que se guarda un producto, el backend ya llama a /api/revalidate y
// esta ficha se actualiza al instante (ver RevalidateFrontend en Laravel).
// Este valor solo cubre el caso de que ese aviso falle. Antes estaba en 60s
// — con 800+ productos eso generaba una cantidad enorme de escrituras ISR
// (superó el límite mensual del plan de Vercel: 2.1M de 200K). 1 hora sigue
// siendo un margen amplio para ese caso raro, sin ese costo.
export const revalidate = 3600;

export async function generateStaticParams() {
  // Con backend activo, las fichas se renderizan on-demand (no requieren la API
  // durante el build). Con mocks, se pre-generan todas.
  if (isApiConfigured()) return [];
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  return (
    <div className="container-px py-8">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Tienda", href: "/tienda" },
          {
            label: product.categoryName,
            href: `/tienda?categoria=${product.categorySlug}`,
          },
          { label: product.name },
        ]}
      />

      <div className="mt-8">
        <ProductDetail product={product} />
        <ProductReviews productId={product.id} />
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading
            eyebrow="También te puede gustar"
            title="Completá tu look"
            align="left"
          />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

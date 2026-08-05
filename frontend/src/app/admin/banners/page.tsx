import { PageHeader } from "@/components/admin/ui";
import { AppearanceBadges } from "@/components/admin/appearance-badges";
import { AppearanceBars } from "@/components/admin/appearance-bars";
import { AppearanceHero } from "@/components/admin/appearance-hero";
import { AppearanceBanners } from "@/components/admin/appearance-banners";
import { AppearanceAbout } from "@/components/admin/appearance-about";
import { AppearanceNosotros } from "@/components/admin/appearance-nosotros";
import { AppearanceCollection } from "@/components/admin/appearance-collection";
import { AppearanceBrands } from "@/components/admin/appearance-brands";
import { AppearanceInstagram } from "@/components/admin/appearance-instagram";

export const metadata = { title: "Apariencia" };

export default function AdminApariencia() {
  return (
    <>
      <PageHeader
        title="Apariencia de la home"
        description="Editá las imágenes y los textos de cada sección. Coincide 1:1 con lo que se ve en el inicio."
      />

      {/* Índice de secciones */}
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {["Barra superior", "Beneficios", "Hero", "Banners", "Nosotros (home)", "Página Nosotros", "Colección", "Marcas", "Instagram"].map((s) => (
          <span key={s} className="rounded-full border border-line bg-white px-3 py-1.5 text-body">
            {s}
          </span>
        ))}
      </div>

      {/* SECCIONES CONECTADAS AL BACKEND */}
      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50/40 p-4">
        <p className="mb-4 flex items-center gap-2 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Estas secciones se guardan y se reflejan en la tienda al instante.
        </p>
        <div className="flex flex-col gap-6">
          <AppearanceHero />
          <AppearanceBars />
          <AppearanceBadges />
          <AppearanceBanners />
          <AppearanceAbout />
          <AppearanceNosotros />
          <AppearanceCollection />
          <AppearanceBrands />
          <AppearanceInstagram />
        </div>
      </div>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BannerItem } from "@/lib/data/settings";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

function Banner({ banner, className }: { banner?: BannerItem; className?: string }) {
  if (!banner) return null;
  return (
    <Link
      href={banner.href}
      className={cn("group relative block overflow-hidden rounded-2xl bg-khaki-200", className)}
    >
      <Image
        src={banner.image}
        alt={banner.title}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover card-hover-img"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-center p-7 sm:p-9">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          {banner.eyebrow}
        </span>
        <h3 className="mt-2 max-w-[14ch] font-display text-2xl leading-tight text-ink sm:text-3xl">
          {banner.title}
        </h3>
        {banner.cta && (
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink underline-offset-4 group-hover:text-brand group-hover:underline">
            Comprar ahora <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </Link>
  );
}

export function Banners({ items }: { items?: BannerItem[] }) {
  const banners = items ?? DEFAULT_SETTINGS.banners.items;
  const bySlot = (slot: BannerItem["slot"]) => banners.find((b) => b.slot === slot);

  return (
    <section className="container-px py-14">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <Banner banner={bySlot("principal")} className="col-span-2 h-64" />
          <Banner banner={bySlot("chico-1")} className="h-56" />
          <Banner banner={bySlot("chico-2")} className="h-56" />
        </div>
        <Banner banner={bySlot("alto")} className="min-h-[400px] lg:min-h-full" />
      </div>
    </section>
  );
}

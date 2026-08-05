import { cn, discountPercent, formatPrice } from "@/lib/utils";

export function Price({
  price,
  compareAtPrice,
  className,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = discountPercent(price, compareAtPrice);
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };
  return (
    <span className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-ink", sizes[size])}>
        {formatPrice(price)}
      </span>
      {pct > 0 && (
        <>
          <span className="text-sm text-muted line-through">
            {formatPrice(compareAtPrice!)}
          </span>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            -{pct}%
          </span>
        </>
      )}
    </span>
  );
}

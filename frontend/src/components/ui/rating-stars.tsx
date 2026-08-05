import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < Math.round(rating)
                ? "fill-gold text-gold"
                : "fill-khaki-200 text-khaki-200",
            )}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo oficial: monograma ovalado dorado + lockup "PETTY JOYAS". */
export function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/assets/img/logo/petty-mark.png"
        alt="Petty Joyas"
        width={62}
        height={95}
        className="h-11 w-auto"
      />
      <span
        className={cn(
          "flex flex-col leading-none transition-colors",
          variant === "light" ? "text-white" : "text-[#5f4b41]",
        )}
      >
        <span className="text-lg font-medium tracking-[0.2em]">PETTY</span>
        <span className="mt-1 text-[10px] font-normal tracking-[0.5em]">JOYAS</span>
      </span>
    </span>
  );
}

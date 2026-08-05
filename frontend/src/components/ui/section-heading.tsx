import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && <span className="section-subtitle">{eyebrow}</span>}
      <h2 className="section-title max-w-2xl">{title}</h2>
      {description && (
        <p className="max-w-xl text-sm leading-relaxed text-body">{description}</p>
      )}
    </div>
  );
}

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Encabezado de página del panel: título + descripción + acción. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-body">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  positive = true,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon && <span className="text-gold">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            positive ? "text-green-600" : "text-red-500",
          )}
        >
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {delta} vs. mes anterior
        </p>
      )}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
        className ?? "bg-stone-bg text-body",
      )}
    >
      {children}
    </span>
  );
}

/** Grilla responsive de cards (reemplaza a las tablas en el panel). */
export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {children}
    </div>
  );
}

/** Fila clave→valor dentro de una card. */
export function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right text-ink">{children}</span>
    </div>
  );
}

/** Interruptor visual (solo diseño). */
export function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-block h-5.5 w-10 rounded-full transition",
        on ? "bg-green-500" : "bg-khaki-200",
      )}
      style={{ height: 22 }}
    >
      <span
        className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all"
        style={{ left: on ? 22 : 3 }}
      />
    </span>
  );
}

/** Etiqueta de campo con marca de obligatorio (*) u opcional. */
export function FieldLabel({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-xs font-medium text-ink">
      {label}
      {required && <span className="text-brand"> *</span>}
      {optional && <span className="font-normal text-muted"> (opcional)</span>}
    </span>
  );
}

export function Field({
  label,
  placeholder,
  defaultValue,
  type = "text",
  className,
  required,
  optional,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  className?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <FieldLabel label={label} required={required} optional={optional} />
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-brand"
      />
    </label>
  );
}

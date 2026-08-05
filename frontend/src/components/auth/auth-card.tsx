import Image from "next/image";
import Link from "next/link";

/** Contenedor centrado para las pantallas de autenticación. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-px flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-[0_18px_50px_rgba(1,15,28,0.06)] sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src="/assets/img/logo/petty-mark.png"
              alt="Petty Joyas"
              width={46}
              height={70}
              className="mb-4 h-14 w-auto"
            />
            <h1 className="font-display text-3xl text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-body">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-body">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-brand"
      />
    </label>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-medium text-ink transition hover:border-ink"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
      </svg>
      {label}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs uppercase tracking-wide text-muted">o</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

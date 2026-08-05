"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "nuevos", label: "Más nuevos" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export function ShopSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("orden") ?? "relevancia";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "relevancia") params.delete("orden");
    else params.set("orden", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-body">
      <span className="hidden sm:inline">Ordenar:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-brand"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

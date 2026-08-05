"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Download, ExternalLink, Mail, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { PageHeader } from "@/components/admin/ui";
import { SEGMENT_STYLE } from "@/lib/status-styles";

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  created_at: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_segment: string | null;
  customer_vip: boolean;
};

type ApiResponse = {
  total: number;
  crm_linked: number;
  subscribers: Subscriber[];
};

export default function NewsletterPage() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["admin", "newsletter", showAll],
    queryFn: () =>
      apiFetch(`/admin/newsletter?active_only=${showAll ? "false" : "true"}`),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/newsletter/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "newsletter"] }),
  });

  function exportCsv() {
    if (!data?.subscribers.length) return;
    const rows = [
      ["Email", "Nombre", "Cliente CRM", "Segmento", "Fecha"].join(","),
      ...data.subscribers.map((s) =>
        [
          s.email,
          s.name ?? "",
          s.customer_name ?? "",
          s.customer_segment ?? "",
          new Date(s.created_at).toLocaleDateString("es-AR"),
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="Suscriptores del sitio. Los vinculados al CRM se pueden ver en el perfil del cliente."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10">
              <Users className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{data?.total ?? "—"}</p>
              <p className="text-xs text-stone-500">Suscriptores activos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10">
              <Mail className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{data?.crm_linked ?? "—"}</p>
              <p className="text-xs text-stone-500">Vinculados al CRM</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100">
              <Crown className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">
                {data
                  ? data.subscribers.filter((s) => s.active && s.customer_vip).length
                  : "—"}
              </p>
              <p className="text-xs text-stone-500">Suscriptores VIP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded"
          />
          Mostrar desuscriptos también
        </label>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-stone-400">Cargando…</div>
        ) : !data?.subscribers.length ? (
          <div className="p-10 text-center text-sm text-stone-400">
            No hay suscriptores todavía.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-left text-xs text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Cliente CRM</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Suscripto</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{s.email}</p>
                    {s.name && <p className="text-xs text-stone-400">{s.name}</p>}
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    {s.customer_id ? (
                      <Link
                        href={`/admin/clientes/${s.customer_id}`}
                        className="flex items-center gap-1.5 text-brand hover:underline"
                      >
                        {s.customer_vip && <Crown className="h-3.5 w-3.5 text-gold" />}
                        <span>{s.customer_name}</span>
                        {s.customer_segment && (
                          <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${SEGMENT_STYLE[s.customer_segment] ?? "bg-stone-100 text-stone-500"}`}>
                            {s.customer_segment}
                          </span>
                        )}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    ) : (
                      <span className="text-stone-300">Sin cuenta</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3 text-stone-400 sm:table-cell">
                    {new Date(s.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.active
                          ? "bg-green-50 text-green-700"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {s.active ? "Activo" : "Desuscripto"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.active && (
                      <button
                        onClick={() => remove.mutate(s.id)}
                        disabled={remove.isPending}
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Desuscribir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-stone-400">
        El envío de emails masivos estará disponible cuando se configure la cuenta de correo.
      </p>
    </div>
  );
}

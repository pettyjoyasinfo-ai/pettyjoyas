"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Badge, CardGrid, KV, PageHeader } from "@/components/admin/ui";
import { LoadingScreen, Spinner } from "@/components/ui/spinner";
import { fetchCustomersExport, useAdminCustomers } from "@/lib/api/admin";
import { SEGMENT_STYLE } from "@/lib/status-styles";
import { formatPrice } from "@/lib/utils";

const FILTERS = [
  { label: "Todos", q: "" },
  { label: "VIP", q: "?vip=1" },
  { label: "Recurrentes", q: "?segmento=recurrente" },
  { label: "Nuevos", q: "?segmento=nuevo" },
  { label: "Inactivos", q: "?segmento=inactivo" },
];

const BRAND = "FF8B1A2E";
const GOLD  = "FFB8962E";
const LIGHT = "FFFAF7F4";
const BORDER_COLOR = "FFE8DDD5";

async function exportXlsx(customers: any[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Petty Joyas Admin";
  const ws = wb.addWorksheet("Clientes", { views: [{ state: "frozen", ySplit: 1 }] });

  ws.columns = [
    { header: "ID",              key: "id",         width: 8  },
    { header: "Nombre",          key: "name",       width: 30 },
    { header: "Email",           key: "email",      width: 32 },
    { header: "Teléfono",        key: "phone",      width: 18 },
    { header: "Segmento",        key: "segment",    width: 14 },
    { header: "VIP",             key: "vip",        width: 6  },
    { header: "Pedidos",         key: "orders",     width: 10 },
    { header: "Gastado ARS",     key: "spent",      width: 16 },
    { header: "Newsletter",      key: "newsletter", width: 12 },
    { header: "Cumpleaños",      key: "birthday",   width: 14 },
    { header: "Cliente desde",   key: "since",      width: 18 },
  ];

  ws.getRow(1).eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "medium", color: { argb: GOLD } } };
  });
  ws.getRow(1).height = 28;

  customers.forEach((c, i) => {
    const row = ws.addRow({
      id:         c.id,
      name:       c.name,
      email:      c.email ?? "",
      phone:      c.phone ?? "",
      segment:    c.segment,
      vip:        c.vip ? "Sí" : "No",
      orders:     c.orders,
      spent:      c.spent,
      newsletter: c.newsletterSubscribed ? "Sí" : "No",
      birthday:   c.birthday ?? "",
      since:      c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-AR") : "",
    });

    const even = i % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: even ? "FFFFFFFF" : LIGHT } };
      cell.font = { size: 10, name: "Calibri", color: { argb: "FF1A1A2E" } };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right:  { style: "thin", color: { argb: BORDER_COLOR } },
      };
      if (colNum === 8) cell.numFmt = '#,##0';
    });
    row.height = 22;
  });

  const sumRow = ws.addRow({
    id: "", name: `Total: ${customers.length} clientes`, email: "", phone: "",
    segment: "", vip: "",
    orders: customers.reduce((s: number, c: any) => s + (c.orders ?? 0), 0),
    spent:  customers.reduce((s: number, c: any) => s + (c.spent ?? 0), 0),
    newsletter: customers.filter((c: any) => c.newsletterSubscribed).length + " suscrip.",
    birthday: "", since: "",
  });
  sumRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle" };
  });
  sumRow.height = 24;

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `petty-joyas-clientes-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminClientes() {
  const [f, setF] = useState("");
  const [exporting, setExporting] = useState(false);
  const { data: customers = [], isLoading } = useAdminCustomers(f);

  async function handleExport() {
    setExporting(true);
    try {
      const all = await fetchCustomersExport(f);
      await exportXlsx(all);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Base única online + local, con segmentación automática y VIP manual."
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting || isLoading}
              className="btn-outline px-4 py-2 text-xs"
            >
              {exporting ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              {" "}Exportar XLSX
            </button>
            <Link href="/admin/clientes/nuevo" className="btn-brand px-4 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Nuevo cliente
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <button
            key={x.label}
            onClick={() => setF(x.q)}
            className={f === x.q ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white" : "rounded-full border border-line bg-white px-4 py-1.5 text-xs text-body transition hover:border-ink"}
          >
            {x.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingScreen label="Cargando clientes…" />
      ) : (
        <CardGrid>
          {customers.map((c: any) => (
            <div key={c.id} className="rounded-2xl border border-line bg-white p-5 transition hover:shadow-[0_8px_24px_rgba(1,15,28,0.06)]">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-khaki-100 font-display text-lg text-gold-700">
                  {c.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-xs text-muted">{c.email}</p>
                </div>
                <Badge className={SEGMENT_STYLE[c.segment]}>{c.segment}</Badge>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3.5">
                <KV label="Compras">{c.orders} pedidos</KV>
                <KV label="Total gastado"><span className="font-semibold">{formatPrice(c.spent)}</span></KV>
                {c.birthday && <KV label="Cumpleaños">🎂 {c.birthday}</KV>}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink transition hover:text-brand"
                >
                  Enviar email
                </Link>
                <Link href={`/admin/clientes/${c.id}`} className="text-xs font-medium text-brand hover:underline">Ver ficha →</Link>
              </div>
            </div>
          ))}
        </CardGrid>
      )}
    </>
  );
}

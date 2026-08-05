"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Badge, CardGrid, PageHeader, StatCard } from "@/components/admin/ui";
import { LoadingScreen, Spinner } from "@/components/ui/spinner";
import { useAdminCategories, useAdminProducts, useCreateProduct, useDeleteProduct } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

function stockLevel(p: any): "ok" | "low" | "out" {
  const s = totalStock(p);
  if (s <= 0) return "out";
  if (s <= 5) return "low";
  return "ok";
}

function totalStock(p: any): number {
  return p.stock ?? 0;
}

// ── Export XLSX ──────────────────────────────────────────────────────────────

async function exportXlsx(products: any[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Petty Joyas Admin";
  const ws = wb.addWorksheet("Productos", { views: [{ state: "frozen", ySplit: 1 }] });

  const BRAND = "FF8B1A2E";
  const GOLD = "FFB8962E";
  const LIGHT = "FFFAF7F4";
  const BORDER_COLOR = "FFE8DDD5";

  const cols = [
    { header: "ID",            key: "id",           width: 8  },
    { header: "Nombre",        key: "name",         width: 36 },
    { header: "Categoría",     key: "category",     width: 18 },
    { header: "Colección",     key: "collection",   width: 16 },
    { header: "Precio (ARS)",  key: "price",        width: 16 },
    { header: "Stock total",   key: "stock",        width: 12 },
    { header: "Variantes",     key: "variants",     width: 40 },
    { header: "Estado",        key: "status",       width: 12 },
    { header: "Slug",          key: "slug",         width: 30 },
  ];
  ws.columns = cols;

  // Header row
  ws.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = {
      bottom: { style: "medium", color: { argb: GOLD } },
    };
  });
  ws.getRow(1).height = 28;

  // Data rows
  products.forEach((p, i) => {
    const variantStr = p.variants?.length
      ? p.variants.map((v: any) => `${v.label} (stock: ${v.stock ?? 0})`).join(" | ")
      : "";

    const row = ws.addRow({
      id: p.id,
      name: p.name,
      category: p.categoryName ?? "",
      collection: p.collection ?? "",
      price: p.price,
      stock: totalStock(p),
      variants: variantStr,
      status: totalStock(p) <= 0 ? "Sin stock" : totalStock(p) <= 5 ? "Stock bajo" : "OK",
      slug: p.slug,
    });

    const even = i % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: even ? "FFFFFFFF" : LIGHT } };
      cell.font = { size: 10, name: "Calibri", color: { argb: "FF1A1A2E" } };
      cell.alignment = { vertical: "middle", wrapText: colNum === 7 };
      cell.border = {
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right:  { style: "thin", color: { argb: BORDER_COLOR } },
      };
      // Color stock col
      if (colNum === 6) {
        const s = totalStock(p);
        if (s <= 0) {
          cell.font = { ...cell.font, color: { argb: "FFCC0000" }, bold: true };
        } else if (s <= 5) {
          cell.font = { ...cell.font, color: { argb: "FFB45309" }, bold: true };
        } else {
          cell.font = { ...cell.font, color: { argb: "FF166534" } };
        }
      }
      // Status col badge-like
      if (colNum === 8) {
        const s = totalStock(p);
        if (s <= 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        else if (s <= 5) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        else cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      }
      // Price formatting
      if (colNum === 5) {
        cell.numFmt = '#,##0';
      }
    });
    row.height = 22;
  });

  // Summary row
  const sumRow = ws.addRow({
    id: "", name: `Total: ${products.length} productos`, category: "", collection: "",
    price: "",
    stock: products.reduce((s, p) => s + totalStock(p), 0),
    variants: "", status: "", slug: "",
  });
  sumRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle" };
  });
  sumRow.height = 24;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `petty-joyas-productos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import XLSX ──────────────────────────────────────────────────────────────

async function parseXlsx(file: File): Promise<any[]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const buf = await file.arrayBuffer();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const rows: any[] = [];

  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // skip header
    const vals = row.values as any[];
    const name = vals[2]?.toString().trim();
    if (!name) return;
    rows.push({
      name,
      category: vals[3]?.toString().trim() ?? "",
      collection: vals[4]?.toString().trim() ?? "",
      price: Number(vals[5]) || 0,
      stock: Number(vals[6]) || 0,
    });
  });

  return rows;
}

// ── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, categories }: { onClose: () => void; categories: any[] }) {
  const [rows, setRows] = useState<any[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [progress, setProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const create = useCreateProduct();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParsing(true);
    setFileError(null);
    try {
      const parsed = await parseXlsx(file);
      setRows(parsed);
      setStep("preview");
    } catch {
      setFileError("No se pudo leer el archivo. Asegurate de usar la plantilla descargada.");
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    const catMap: Record<string, number> = {};
    categories.forEach((c: any) => { catMap[c.name?.toLowerCase()] = c.id; });

    setProgress({ done: 0, total: rows.length, errors: [] });
    setStep("done");

    let done = 0;
    const errors: string[] = [];

    for (const r of rows) {
      const catId = catMap[r.category?.toLowerCase()];
      if (!catId) { errors.push(`"${r.name}": categoría "${r.category}" no encontrada`); done++; setProgress({ done, total: rows.length, errors: [...errors] }); continue; }
      try {
        await create.mutateAsync({ name: r.name, category_id: catId, collection: r.collection || null, price: r.price, stock: r.stock, active: true, images: [], variants: [] });
        done++;
        setProgress({ done, total: rows.length, errors: [...errors] });
      } catch (e: any) {
        errors.push(`"${r.name}": ${e?.message ?? "error"}`);
        done++;
        setProgress({ done, total: rows.length, errors: [...errors] });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-semibold text-ink">Importar productos desde XLSX</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6">
          {step === "upload" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-body">
                Usá la plantilla oficial para garantizar que el formato sea correcto. Las columnas requeridas son: <strong>Nombre</strong>, <strong>Categoría</strong>, <strong>Precio</strong> y <strong>Stock</strong>.
              </p>
              <div
                className="cursor-pointer rounded-xl border-2 border-dashed border-line bg-stone-bg px-6 py-10 text-center transition hover:border-brand"
                onClick={() => fileRef.current?.click()}
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Spinner className="h-6 w-6 text-brand" />
                    <p className="text-sm text-muted">Leyendo archivo…</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted" />
                    <p className="text-sm font-medium text-ink">Arrastrá o hacé clic para subir el XLSX</p>
                    <p className="mt-1 text-xs text-muted">Solo archivos .xlsx</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              </div>
              {fileError && (
                <p className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {fileError}
                </p>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-body">Se encontraron <strong>{rows.length} productos</strong> para importar. Revisá los datos antes de confirmar.</p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-line">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-stone-bg">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted">Nombre</th>
                      <th className="px-3 py-2 text-left text-muted">Categoría</th>
                      <th className="px-3 py-2 text-right text-muted">Precio</th>
                      <th className="px-3 py-2 text-right text-muted">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-1.5 text-ink">{r.name}</td>
                        <td className="px-3 py-1.5 text-body">{r.category}</td>
                        <td className="px-3 py-1.5 text-right text-ink">{formatPrice(r.price)}</td>
                        <td className="px-3 py-1.5 text-right text-body">{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setStep("upload")} className="btn-outline px-4 py-2 text-xs">Volver</button>
                <button onClick={doImport} className="btn-brand px-4 py-2 text-xs">Importar {rows.length} productos</button>
              </div>
            </div>
          )}

          {step === "done" && progress && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Importando productos…</p>
                <span className="text-sm text-muted">{progress.done}/{progress.total}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-bg">
                <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              {progress.errors.length > 0 && (
                <div className="rounded-xl bg-red-50 px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700"><AlertTriangle className="h-3.5 w-3.5" /> {progress.errors.length} errores</p>
                  <ul className="flex flex-col gap-1 text-xs text-red-600">
                    {progress.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {progress.done === progress.total && (
                <div className="flex justify-end">
                  <button onClick={onClose} className="btn-brand px-4 py-2 text-xs">
                    Listo — {progress.total - progress.errors.length} importados
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Image Gallery ────────────────────────────────────────────────────

function ProductImageGallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : [];

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + 1) % imgs.length);
  };
  const goTo = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i);
  };

  return (
    <div className="group/gal relative aspect-[4/3] overflow-hidden bg-stone-bg">
      {imgs[idx] && (
        <Image
          key={imgs[idx]}
          src={imgs[idx]}
          alt={`${name} ${idx + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover transition-opacity duration-200"
        />
      )}

      {imgs.length > 1 && (
        <>
          {/* Prev */}
          <button
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white shadow transition hover:bg-black/65 md:opacity-0 md:group-hover/gal:opacity-100"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white shadow transition hover:bg-black/65 md:opacity-0 md:group-hover/gal:opacity-100"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goTo(e, i)}
                aria-label={`Ir a imagen ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? "h-1.5 w-3.5 bg-white" : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Contador */}
          <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] leading-none text-white md:opacity-0 md:group-hover/gal:opacity-100 transition">
            {idx + 1}/{imgs.length}
          </span>
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const STOCK_FILTERS = ["Todos", "Con stock", "Stock bajo", "Sin stock"] as const;

export default function AdminProductos() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: categories = [] } = useAdminCategories();
  const deleteProduct = useDeleteProduct();
  const [stockFilter, setStockFilter] = useState<string>("Todos");
  const [catFilter, setCatFilter] = useState<string>("Todas");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Derive category list from loaded products
  const catNames = Array.from(new Set(products.map((p: any) => p.categoryName).filter(Boolean))) as string[];

  const list = products.filter((p: any) => {
    const q = search.trim().toLowerCase();
    if (q && !p.name?.toLowerCase().includes(q) && !p.categoryName?.toLowerCase().includes(q) && !p.collection?.toLowerCase().includes(q)) return false;
    const cat = catFilter === "Todas" || p.categoryName === catFilter;
    const s = stockLevel(p);
    const stock =
      stockFilter === "Todos" ? true :
      stockFilter === "Con stock" ? s === "ok" :
      stockFilter === "Stock bajo" ? s === "low" :
      stockFilter === "Sin stock" ? s === "out" : true;
    return cat && stock;
  });

  // Metrics
  const totalUnits = products.reduce((s: number, p: any) => s + totalStock(p), 0);
  const invValue   = products.reduce((s: number, p: any) => s + p.price * totalStock(p), 0);
  const lowCount   = products.filter((p: any) => stockLevel(p) === "low").length;
  const outCount   = products.filter((p: any) => stockLevel(p) === "out").length;

  async function handleExport() {
    setExporting(true);
    try { await exportXlsx(products); } finally { setExporting(false); }
  }

  async function handleDelete(slug: string) {
    setDeleteError(null);
    try {
      await deleteProduct.mutateAsync(slug);
      setConfirmDelete(null);
    } catch (e: any) {
      setDeleteError(e?.details?.message ?? "No se pudo eliminar el producto. Probá de nuevo.");
    }
  }

  return (
    <>
      {showImport && <ImportModal onClose={() => setShowImport(false)} categories={categories} />}

      <PageHeader
        title="Productos"
        description={`${products.length} productos · catálogo ilimitado`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="btn-outline px-4 py-2 text-xs">
              <Upload className="h-3.5 w-3.5" /> Importar XLSX
            </button>
            <button onClick={handleExport} disabled={exporting || isLoading} className="btn-outline px-4 py-2 text-xs">
              {exporting ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />} Exportar XLSX
            </button>
            <Link href="/admin/productos/nuevo" className="btn-brand px-4 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Nuevo producto
            </Link>
          </div>
        }
      />

      {/* Métricas de inventario */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Unidades en stock" value={String(totalUnits)} />
        <StatCard label="Valor del inventario" value={formatPrice(invValue)} />
        <StatCard label="Stock bajo (≤5)" value={String(lowCount)} />
        <StatCard label="Sin stock" value={String(outCount)} />
      </div>

      {/* Buscador */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, categoría o colección…"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brand"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        {/* Filtro de stock */}
        <div className="flex flex-wrap gap-1.5">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={
                stockFilter === f
                  ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-line bg-white px-4 py-1.5 text-xs text-body transition hover:border-ink"
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="h-7 w-px self-center bg-line" />

        {/* Filtro por categoría */}
        <div className="flex flex-wrap gap-1.5">
          {["Todas", ...catNames].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={
                catFilter === c
                  ? "rounded-full bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand"
                  : "rounded-full border border-line bg-white px-4 py-1.5 text-xs text-body transition hover:border-brand"
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingScreen label="Cargando productos…" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted">
          <p className="text-sm">Ningún producto cumple los filtros seleccionados.</p>
          <button onClick={() => { setStockFilter("Todos"); setCatFilter("Todas"); setSearch(""); }} className="btn-outline px-4 py-2 text-xs">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <CardGrid className="xl:grid-cols-4">
          {list.map((p: any) => {
            const level = stockLevel(p);
            const stock = totalStock(p);
            return (
              <div key={p.id} className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-[0_8px_24px_rgba(1,15,28,0.06)]">
                <div className="relative">
                  <ProductImageGallery
                    images={[
                      ...(p.images ?? []),
                      ...((p.variants ?? []).map((v: any) => v.imageUrl).filter(Boolean)),
                    ].filter((url, i, arr) => arr.indexOf(url) === i)}
                    name={p.name}
                  />
                  <div className="absolute left-2.5 top-2.5 flex gap-1.5 pointer-events-none">
                    <Badge className={level === "out" ? "bg-white/90 text-red-600" : level === "low" ? "bg-white/90 text-amber-600" : "bg-white/90 text-green-700"}>
                      {level === "out" ? "Sin Stock" : level === "low" ? "Stock Bajo" : "En Stock"}
                    </Badge>
                    {p.compareAtPrice && <Badge className="bg-brand text-white">Oferta</Badge>}
                  </div>
                  <div className="absolute right-2.5 top-2.5 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100">
                    <Link href={`/admin/productos/${p.slug}/editar`} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => { setDeleteError(null); setConfirmDelete(p.slug); }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="truncate font-medium text-ink">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{p.categoryName}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-semibold text-ink">{formatPrice(p.price)}</span>
                    <span className={`text-xs font-medium ${level === "out" ? "text-red-600" : level === "low" ? "text-amber-600" : "text-body"}`}>
                      {level === "out" ? "Sin stock" : `${stock} ud${stock !== 1 ? "s" : ""}.`}
                    </span>
                  </div>
                  {p.variants?.length > 0 && (
                    <p className="mt-1 text-[10px] text-muted">{p.variants.length} variante{p.variants.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
                {confirmDelete === p.slug && (
                  <div className="border-t border-red-100 bg-red-50 p-3">
                    <p className="flex items-start gap-1.5 text-[11px] text-red-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {deleteError ?? "Se archivará y desaparecerá del catálogo. El historial de pedidos se conserva."}
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-body hover:bg-white"
                      >
                        {deleteError ? "Cerrar" : "Cancelar"}
                      </button>
                      {!deleteError && (
                        <button
                          type="button"
                          onClick={() => handleDelete(p.slug)}
                          disabled={deleteProduct.isPending}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleteProduct.isPending ? "Eliminando…" : "Sí, eliminar"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardGrid>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { LoadingScreen, Spinner } from "@/components/ui/spinner";
import {
  useAdminCategories,
  useAdminProduct,
  useUpdateProduct,
  useUploadMedia,
  useVariantSuggestions,
} from "@/lib/api/admin";
import { toNumber } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  material: "Material",
  talle: "Talle",
  largo: "Largo",
  color: "Color",
  piedra: "Piedra",
  variante: "Variante",
};

type VariantRow = {
  id?: string;
  label: string;
  type: string;
  price_delta: string;
  weight: string;
  stock: string;
  image: string;
};

const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-brand";

export default function EditarProducto() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading: loadingProduct } = useAdminProduct(params.id);
  const { data: categories = [] } = useAdminCategories();
  const update = useUpdateProduct();
  const uploadProduct = useUploadMedia("products");
  const uploadVariant = useUploadMedia("variants");
  const { data: suggestions } = useVariantSuggestions();

  const [form, setForm] = useState<any>({
    name: "", category_id: "", collection: "",
    price: "", stock: "",
    short_description: "", description: "",
    whatsapp_url: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantUploading, setVariantUploading] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [initialized, setInitialized] = useState(false);

  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Prefill form once product + categories are loaded
  useEffect(() => {
    if (!product || !categories.length || initialized) return;
    const cat = categories.find((c: any) => c.slug === product.categorySlug);
    setForm({
      name: product.name ?? "",
      category_id: cat ? cat.id : "",
      collection: product.collection ?? "",
      price: String(product.price ?? ""),
      stock: product.stock != null ? String(product.stock) : "",
      short_description: product.shortDescription ?? "",
      description: product.description ?? "",
      whatsapp_url: product.whatsappUrl ?? "",
    });
    setImages(product.images ?? []);
    setVariants(
      (product.variants ?? []).map((v: any) => ({
        id: v.id,
        label: v.label ?? "",
        type: v.type ?? "material",
        price_delta: v.priceDelta != null ? String(v.priceDelta) : "",
        weight: v.weight != null ? String(v.weight) : "",
        stock: v.stock != null ? String(v.stock) : "",
        image: v.imageUrl ?? "",
      }))
    );
    setInitialized(true);
  }, [product, categories, initialized]);

  function set(k: string, v: string) { setForm((f: any) => ({ ...f, [k]: v })); }

  function addVariant() {
    setVariants((v) => [...v, { label: "", type: "material", price_delta: "", weight: "", stock: "", image: "" }]);
  }
  function quickAddVariant(type: string, value: string) {
    setVariants((v) => {
      if (v.some((x) => x.type === type && x.label.trim().toLowerCase() === value.toLowerCase())) return v;
      return [...v, { label: value, type, price_delta: "", weight: "", stock: "", image: "" }];
    });
  }
  function setVariantField(i: number, k: keyof VariantRow, val: string) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, [k]: val } : v)));
  }
  function removeVariant(i: number) {
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  }

  async function handleAddImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    setMsg("");
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadProduct.mutateAsync(file);
        setImages((im) => [...im, url]);
      }
    } catch {
      setMsg("No se pudo subir alguna imagen. Probá de nuevo (máx. 5 MB cada una).");
    } finally {
      setUploadingImages(false);
    }
  }

  function removeImage(i: number) {
    setImages((im) => im.filter((_, idx) => idx !== i));
  }

  async function handleVariantImage(i: number, file: File | undefined) {
    if (!file) return;
    setVariantUploading(i);
    setMsg("");
    try {
      const { url } = await uploadVariant.mutateAsync(file);
      setVariantField(i, "image", url);
    } catch {
      setMsg("No se pudo subir la imagen de la variante.");
    } finally {
      setVariantUploading(null);
    }
  }

  async function save() {
    setMsg("");
    try {
      await update.mutateAsync({
        id: params.id,
        body: {
          name: form.name,
          category_id: form.category_id,
          collection: form.collection || null,
          price: toNumber(form.price),
          stock: variants.filter((v) => v.label.trim()).length === 0 ? toNumber(form.stock || 0) : undefined,
          short_description: form.short_description || null,
          description: form.description || null,
          whatsapp_url: form.whatsapp_url || null,
          images,
          variants: variants
            .filter((v) => v.label.trim())
            .map((v) => ({
              ...(v.id ? { id: Number(v.id) } : {}),
              label: v.label,
              type: v.type || "variante",
              value: v.label,
              price_delta: v.price_delta ? toNumber(v.price_delta) : 0,
              weight: v.weight ? toNumber(v.weight) : null,
              stock: v.stock ? toNumber(v.stock) : 0,
              image_url: v.image || null,
            })),
        },
      });
      router.push("/admin/productos");
    } catch (e: any) {
      setMsg(e?.message ?? "Error al guardar. Revisá los campos obligatorios.");
    }
  }

  const canSave = form.name.trim() && form.category_id && form.price;

  if (loadingProduct || !initialized) {
    return <LoadingScreen label="Cargando producto…" />;
  }

  return (
    <>
      <PageHeader
        title="Editar producto"
        description={product?.name ?? ""}
        action={
          <div className="flex gap-2">
            <Link href="/admin/productos" className="btn-outline px-4 py-2 text-xs">Cancelar</Link>
            <button onClick={save} disabled={update.isPending || !canSave} className="btn-brand px-4 py-2 text-xs">
              {update.isPending ? <Spinner /> : "Guardar cambios"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card title="Información general">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-ink">Nombre *</span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Anillo Solitario Aura" className={inp} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Categoría *</span>
                <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inp}>
                  <option value="">Elegí una categoría…</option>
                  {(() => {
                    const roots = categories.filter((c: any) => !c.parentSlug);
                    const byParent: Record<string, any[]> = {};
                    for (const c of categories as any[]) {
                      if (c.parentSlug) { byParent[c.parentSlug] ??= []; byParent[c.parentSlug].push(c); }
                    }
                    return roots.map((r: any) => {
                      const children = byParent[r.slug] ?? [];
                      return children.length > 0 ? (
                        <optgroup key={r.slug} label={r.name}>
                          <option value={r.id}>{r.name} (general)</option>
                          {children.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                        </optgroup>
                      ) : (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      );
                    });
                  })()}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Colección <span className="font-normal text-muted">(opcional)</span></span>
                <input value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="Eterna" className={inp} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-ink">Descripción corta <span className="font-normal text-muted">(opcional)</span></span>
                <input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} placeholder="Resumen para la grilla de la tienda" className={inp} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-ink">Descripción <span className="font-normal text-muted">(opcional)</span></span>
                <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Contá la historia de la pieza, materiales, terminaciones…" className={inp} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-ink">Link de WhatsApp <span className="font-normal text-muted">(opcional)</span></span>
                <input value={form.whatsapp_url} onChange={(e) => set("whatsapp_url", e.target.value)} placeholder="https://wa.me/5491100000000?text=..." className={inp} />
              </label>
            </div>
          </Card>

          <Card title="Imágenes del producto · opcional">
            <p className="mb-3 text-xs text-muted">
              La primera imagen es la principal. Podés quitar las actuales y agregar nuevas.
            </p>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={img} className="group relative h-28 w-24 overflow-hidden rounded-xl border border-line bg-stone-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-brand px-2 py-0.5 text-[9px] font-medium text-white">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-muted opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                    aria-label="Quitar imagen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => imagesInputRef.current?.click()}
                disabled={uploadingImages}
                className="grid h-28 w-24 place-items-center gap-1 rounded-xl border border-dashed border-line text-muted transition hover:border-brand hover:text-brand"
              >
                {uploadingImages ? <Spinner className="text-brand" /> : (
                  <><ImagePlus className="h-5 w-5" /><span className="text-[10px]">Agregar</span></>
                )}
              </button>
            </div>
            <input
              ref={imagesInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { handleAddImages(e.target.files); e.target.value = ""; }}
            />
          </Card>

          <Card
            title="Variantes (material, talle, largo, color, piedra) · opcional"
            action={
              <button onClick={addVariant} className="flex items-center gap-1.5 text-xs font-medium text-brand">
                <Plus className="h-3.5 w-3.5" /> Agregar variante
              </button>
            }
          >
            {suggestions && Object.keys(suggestions).length > 0 && (
              <div className="mb-4 flex flex-col gap-2 rounded-xl bg-stone-bg p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Más usadas · clic para agregar</p>
                {Object.entries(suggestions).map(([type, values]) =>
                  values.length === 0 ? null : (
                    <div key={type} className="flex flex-wrap items-center gap-1.5">
                      <span className="w-16 shrink-0 text-[11px] font-medium text-ink">{TYPE_LABELS[type] ?? type}</span>
                      {values.slice(0, 10).map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => quickAddVariant(type, s.value)}
                          className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-body transition hover:border-brand hover:text-brand"
                        >
                          + {s.value}
                        </button>
                      ))}
                    </div>
                  ),
                )}
              </div>
            )}

            {variants.length === 0 ? (
              <p className="text-sm text-muted">Sin variantes. Agregá si la pieza tiene talles, materiales u otras opciones.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {variants.map((v, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-end">
                    <VariantImage
                      image={v.image}
                      uploading={variantUploading === i}
                      onPick={(file) => handleVariantImage(i, file)}
                      onClear={() => setVariantField(i, "image", "")}
                    />
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] sm:items-end">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Etiqueta</span>
                        <input value={v.label} onChange={(e) => setVariantField(i, "label", e.target.value)} placeholder="Talle 16 / Oro" className={inp} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Tipo</span>
                        <select value={v.type} onChange={(e) => setVariantField(i, "type", e.target.value)} className={inp}>
                          <option value="material">Material</option>
                          <option value="talle">Talle</option>
                          <option value="largo">Largo</option>
                          <option value="color">Color</option>
                          <option value="piedra">Piedra</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">+/- precio</span>
                        <input value={v.price_delta} onChange={(e) => setVariantField(i, "price_delta", e.target.value)} placeholder="0" className={`${inp} w-24`} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Peso (g) <span className="font-normal">· opcional</span></span>
                        <input value={v.weight} onChange={(e) => setVariantField(i, "weight", e.target.value)} placeholder="0" className={`${inp} w-24`} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Stock</span>
                        <input value={v.stock} onChange={(e) => setVariantField(i, "stock", e.target.value)} placeholder="0" className={`${inp} w-20`} />
                      </label>
                      <button onClick={() => removeVariant(i)} className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Precio">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">Precio (ARS) *</span>
              <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="48000" className={inp} />
            </label>
            <p className="mt-2 text-[11px] text-muted">
              El precio tachado y los descuentos se gestionan desde{" "}
              <Link href="/admin/descuentos" className="font-medium text-brand hover:underline">Descuentos</Link>.
            </p>
          </Card>

          {variants.length === 0 && (
            <Card title="Stock">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">Unidades</span>
                <input value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="10" className={inp} />
              </label>
              <p className="mt-2 text-[11px] text-muted">Se descuenta automáticamente con cada venta.</p>
            </Card>
          )}

          {msg && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{msg}</p>}
        </div>
      </div>
    </>
  );
}

function VariantImage({
  image, uploading, onPick, onClear,
}: {
  image: string; uploading: boolean; onPick: (file: File | undefined) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted">Imagen</span>
      <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-stone-bg">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="absolute inset-0 grid place-items-center bg-ink/0 text-muted transition group-hover:bg-ink/40 group-hover:text-white"
          aria-label="Subir imagen de la variante"
        >
          {uploading ? (
            <Spinner className="text-brand group-hover:text-white" />
          ) : image ? (
            <span className="text-[9px] opacity-0 group-hover:opacity-100">Cambiar</span>
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </button>
        {image && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-muted opacity-0 transition hover:text-red-600 group-hover:opacity-100"
            aria-label="Quitar imagen de la variante"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}

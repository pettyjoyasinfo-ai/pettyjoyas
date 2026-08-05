"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, ChevronRight, ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  useUploadMedia,
} from "@/lib/api/admin";

const inp = "rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand transition";

type FormState = {
  name: string;
  description: string;
  image: string;
  featured: boolean;
  parent_slug: string;
};

type Mode = "root" | "child";

const EMPTY: FormState = { name: "", description: "", image: "", featured: false, parent_slug: "" };

export default function AdminCategorias() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();
  const upload = useUploadMedia("categories");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [mode, setMode] = useState<Mode>("root");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function switchMode(m: Mode) {
    setMode(m);
    if (m === "root") {
      setForm((f) => ({ ...f, parent_slug: "" }));
    } else {
      setForm((f) => ({
        ...f,
        parent_slug: f.parent_slug || (rootCategories[0]?.slug ?? ""),
      }));
    }
  }

  function startEdit(c: any) {
    const isChild = !!c.parentSlug;
    setEditingSlug(c.slug);
    setMode(isChild ? "child" : "root");
    setForm({
      name: c.name,
      description: c.description ?? "",
      image: c.image ?? "",
      featured: !!c.featured,
      parent_slug: c.parentSlug ?? "",
    });
    setMsg("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingSlug(null);
    setForm(EMPTY);
    setMode("root");
    setMsg("");
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await upload.mutateAsync(file);
      set("image", url);
    } catch {
      setMsg("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setMsg("");
    const body: any = {
      name: form.name.trim(),
      description: form.description || null,
      image: form.image || null,
      featured: form.featured,
      parent_slug: mode === "child" ? (form.parent_slug || null) : null,
    };
    try {
      if (editingSlug) {
        await update.mutateAsync({ id: editingSlug, body });
      } else {
        await create.mutateAsync(body);
      }
      cancelEdit();
    } catch {
      setMsg("Error al guardar la categoría.");
    }
  }

  async function remove(c: any) {
    setDeleteError(null);
    try {
      await del.mutateAsync(c.slug);
      setConfirmDelete(null);
      if (editingSlug === c.slug) cancelEdit();
    } catch (e: any) {
      setDeleteError(
        e?.details?.message ?? "No se pudo eliminar (puede tener productos o subcategorías asociadas)."
      );
    }
  }

  const saving = create.isPending || update.isPending;

  const rootCategories = (categories as any[]).filter((c) => !c.parentSlug);
  const byParent: Record<string, any[]> = {};
  for (const c of categories as any[]) {
    if (c.parentSlug) {
      byParent[c.parentSlug] ??= [];
      byParent[c.parentSlug].push(c);
    }
  }

  const editingCat = editingSlug ? (categories as any[]).find((c) => c.slug === editingSlug) : null;
  const editingRootHasChildren = editingCat && !editingCat.parentSlug && (byParent[editingCat.slug]?.length ?? 0) > 0;

  const totalChildren = (categories as any[]).filter((c) => c.parentSlug).length;

  const canSave = form.name.trim() && (mode === "root" || !!form.parent_slug);

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organizá el catálogo con categorías padre e hijas."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* ── Árbol de categorías ── */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-ink">Estructura</h2>
            {!isLoading && (
              <span className="text-xs text-muted">
                {rootCategories.length} padre{rootCategories.length !== 1 ? "s" : ""} · {totalChildren} hija{totalChildren !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading ? (
            <Spinner className="text-brand" />
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
              Todavía no hay categorías. Creá la primera con el formulario →
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {rootCategories.map((root: any) => {
                const children = byParent[root.slug] ?? [];
                const isEditing = editingSlug === root.slug;
                return (
                  <div key={root.slug}>
                    {/* ─ Categoría padre ─ */}
                    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${isEditing ? "border-brand ring-2 ring-brand/20" : "border-brand/25"}`}>
                      <div className="flex items-stretch">
                        <div className="w-1 shrink-0 bg-brand rounded-l-2xl" />
                        {root.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={root.image} alt="" className="h-20 w-24 shrink-0 object-cover" />
                        )}
                        {!root.image && (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-brand/5 text-[10px] text-muted">
                            Sin img
                          </div>
                        )}
                        <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                                Padre
                              </span>
                              {root.featured && (
                                <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  <Star className="h-2.5 w-2.5 fill-amber-600" /> Destacada
                                </span>
                              )}
                            </div>
                            <p className="truncate font-semibold text-ink">{root.name}</p>
                            <p className="text-[11px] text-muted">
                              {children.length > 0
                                ? `${children.length} subcategoría${children.length !== 1 ? "s" : ""}: ${children.map((ch: any) => ch.name).join(", ")}`
                                : "Sin subcategorías"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <button
                              onClick={() => startEdit(root)}
                              className={`flex items-center gap-1 text-xs font-medium transition ${isEditing ? "text-muted" : "text-brand hover:underline"}`}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => { setDeleteError(null); setConfirmDelete(confirmDelete === root.slug ? null : root.slug); }}
                              className="flex items-center gap-1 text-xs text-muted transition hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                      {confirmDelete === root.slug && (
                        <div className="border-t border-red-100 bg-red-50 px-4 py-3">
                          <p className="flex items-start gap-1.5 text-[11px] text-red-700">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {deleteError ?? `¿Eliminar "${root.name}"? No se podrá si tiene productos o subcategorías.`}
                          </p>
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-body hover:bg-white"
                            >
                              Cancelar
                            </button>
                            {!deleteError && (
                              <button
                                type="button"
                                onClick={() => remove(root)}
                                disabled={del.isPending}
                                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                {del.isPending ? "Eliminando…" : "Sí, eliminar"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─ Hijas ─ */}
                    {children.length > 0 && (
                      <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-line pl-4">
                        {children.map((child: any) => {
                          const isEditingChild = editingSlug === child.slug;
                          return (
                            <div
                              key={child.slug}
                              className={`overflow-hidden rounded-xl border bg-stone-50 transition ${isEditingChild ? "border-brand ring-2 ring-brand/20" : "border-line"}`}
                            >
                              <div className="flex items-stretch">
                                {child.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={child.image} alt="" className="h-14 w-14 shrink-0 object-cover" />
                                ) : (
                                  <div className="flex h-14 w-12 shrink-0 items-center justify-center bg-stone-bg text-[9px] text-muted">
                                    Sin img
                                  </div>
                                )}
                                <div className="flex flex-1 items-center justify-between gap-3 px-3 py-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <ChevronRight className="h-3 w-3 shrink-0 text-muted" />
                                    <span className="truncate text-sm font-medium text-ink">{child.name}</span>
                                    <span className="shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] text-muted">Hija</span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    <button
                                      onClick={() => startEdit(child)}
                                      className={`flex items-center gap-1 text-xs font-medium transition ${isEditingChild ? "text-muted" : "text-brand hover:underline"}`}
                                    >
                                      <Pencil className="h-3 w-3" /> Editar
                                    </button>
                                    <button
                                      onClick={() => { setDeleteError(null); setConfirmDelete(confirmDelete === child.slug ? null : child.slug); }}
                                      className="flex items-center gap-1 text-xs text-muted transition hover:text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" /> Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {confirmDelete === child.slug && (
                                <div className="border-t border-red-100 bg-red-50 px-3 py-2.5">
                                  <p className="flex items-start gap-1.5 text-[11px] text-red-700">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    {deleteError ?? `¿Eliminar "${child.name}"? No se podrá si tiene productos asociados.`}
                                  </p>
                                  <div className="mt-2 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-body hover:bg-white"
                                    >
                                      Cancelar
                                    </button>
                                    {!deleteError && (
                                      <button
                                        type="button"
                                        onClick={() => remove(child)}
                                        disabled={del.isPending}
                                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                      >
                                        {del.isPending ? "Eliminando…" : "Sí, eliminar"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Formulario ── */}
        <Card
          title={editingSlug ? `Editando: ${editingCat?.name ?? ""}` : "Nueva categoría"}
          action={
            editingSlug ? (
              <button onClick={cancelEdit} className="flex items-center gap-1 text-xs text-muted hover:text-ink">
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-4">

            {/* Modo: raíz vs hija */}
            <div className="flex gap-1 rounded-xl bg-stone-bg p-1">
              <button
                type="button"
                onClick={() => !editingRootHasChildren && switchMode("root")}
                disabled={!!editingRootHasChildren && mode === "child"}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  mode === "root"
                    ? "bg-white shadow-sm text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                Categoría raíz
              </button>
              <button
                type="button"
                onClick={() => !editingRootHasChildren && switchMode("child")}
                disabled={!!editingRootHasChildren}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  mode === "child"
                    ? "bg-white shadow-sm text-ink"
                    : "text-muted hover:text-ink"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Subcategoría
              </button>
            </div>

            {editingRootHasChildren && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                Esta categoría tiene hijas — no puede convertirse en subcategoría.
              </p>
            )}

            {/* Selector de padre — solo en modo hija */}
            {mode === "child" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">
                  Categoría padre <span className="text-brand">*</span>
                </span>
                <select
                  value={form.parent_slug}
                  onChange={(e) => set("parent_slug", e.target.value)}
                  className={inp + " bg-white"}
                >
                  <option value="">— Seleccioná una categoría padre —</option>
                  {rootCategories
                    .filter((r: any) => r.slug !== editingSlug)
                    .map((r: any) => (
                      <option key={r.slug} value={r.slug}>{r.name}</option>
                    ))}
                </select>
              </label>
            )}

            {/* Imagen — solo para categorías raíz */}
            {mode === "root" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink">
                  Imagen <span className="font-normal text-muted">(opcional)</span>
                </span>
                <div className="group relative h-28 overflow-hidden rounded-xl border border-line bg-stone-bg">
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 grid place-items-center gap-1 text-muted transition group-hover:bg-ink/30 group-hover:text-white"
                  >
                    {uploading ? (
                      <Spinner className="text-brand group-hover:text-white" />
                    ) : form.image ? (
                      <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] text-ink opacity-0 group-hover:opacity-100 transition">
                        Cambiar
                      </span>
                    ) : (
                      <>
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[10px]">Subir imagen</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleImage(e.target.files?.[0]); e.target.value = ""; }}
                />
              </div>
            )}

            {/* Nombre */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">
                Nombre <span className="text-brand">*</span>
              </span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={mode === "child" ? "Ej: Solitarios" : "Ej: Anillos"}
                className={inp}
              />
            </label>

            {/* Descripción */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink">
                Descripción <span className="font-normal text-muted">(opcional)</span>
              </span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Breve descripción que se muestra en la tienda"
                className={inp}
              />
            </label>

            {/* Destacar — solo en raíz */}
            {mode === "root" && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 transition hover:border-brand/30">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="accent-brand"
                />
                <div>
                  <span className="text-xs font-medium text-body">Destacar en la home</span>
                  <p className="text-[10px] text-muted">Aparece en la grilla de categorías destacadas</p>
                </div>
              </label>
            )}

            {/* Botón guardar */}
            <button
              onClick={save}
              disabled={saving || !canSave}
              className="btn-brand py-2.5 text-xs disabled:opacity-50"
            >
              {saving ? (
                <Spinner />
              ) : editingSlug ? (
                <><Check className="h-4 w-4" /> Guardar cambios</>
              ) : mode === "child" ? (
                <><Plus className="h-4 w-4" /> Crear subcategoría</>
              ) : (
                <><Plus className="h-4 w-4" /> Crear categoría raíz</>
              )}
            </button>

            {msg && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-700">{msg}</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

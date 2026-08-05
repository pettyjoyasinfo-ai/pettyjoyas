<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with('parent')
            ->orderBy('position')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'parent_slug' => ['nullable', 'string', 'exists:categories,slug'],
            'featured'    => ['boolean'],
        ]);

        $parentId = isset($data['parent_slug'])
            ? Category::where('slug', $data['parent_slug'])->value('id')
            : null;

        $category = Category::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'image'       => $data['image'] ?? null,
            'parent_id'   => $parentId,
            'featured'    => $data['featured'] ?? false,
            'slug'        => $this->uniqueSlug($data['name'], $parentId),
        ]);

        return new CategoryResource($category->load('parent'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'parent_slug' => ['nullable', 'string', 'exists:categories,slug'],
            'featured'    => ['sometimes', 'boolean'],
            'position'    => ['sometimes', 'integer'],
        ]);

        if (array_key_exists('parent_slug', $data)) {
            $data['parent_id'] = $data['parent_slug']
                ? Category::where('slug', $data['parent_slug'])->value('id')
                : null;
            unset($data['parent_slug']);
        }

        // Solo se recalcula el slug si cambió el nombre (no al mover de padre)
        // para no romper links /tienda?categoria=... ya compartidos.
        if (array_key_exists('name', $data)) {
            $parentId = array_key_exists('parent_id', $data) ? $data['parent_id'] : $category->parent_id;
            $data['slug'] = $this->uniqueSlug($data['name'], $parentId, ignoreId: $category->id);
        }

        $category->update($data);

        return (new CategoryResource($category->load('parent')));
    }

    /**
     * El slug es único en toda la tabla (lo usa /tienda?categoria=slug para
     * identificar la categoría sin ambigüedad), pero el nombre visible NO
     * tiene por qué serlo — dos rubros distintos pueden tener cada uno una
     * subcategoría "Pulseras". Acá se desambigua el slug por detrás en vez de
     * obligar a inventar un nombre más largo ("Pulseras de acero", etc.).
     */
    private function uniqueSlug(string $name, ?int $parentId, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if (! $this->slugTaken($base, $ignoreId)) {
            return $base;
        }

        // Primero un slug legible con el nombre del padre (el caso típico:
        // el mismo nombre de subcategoría en dos rubros distintos).
        if ($parentId && $parentName = Category::whereKey($parentId)->value('name')) {
            $withParent = Str::slug("{$name} {$parentName}");
            if (! $this->slugTaken($withParent, $ignoreId)) {
                return $withParent;
            }
        }

        // Último recurso: sufijo numérico.
        $i = 2;
        while ($this->slugTaken("{$base}-{$i}", $ignoreId)) {
            $i++;
        }

        return "{$base}-{$i}";
    }

    private function slugTaken(string $slug, ?int $ignoreId): bool
    {
        return Category::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();
    }

    public function destroy(Category $category)
    {
        // Solo bloqueamos si hay productos ACTIVOS (los del catálogo real). Los
        // productos archivados (active=false, "borrados" desde el admin) no
        // cuentan: al borrar la categoría, el cascade los elimina y su historial
        // de pedidos se conserva igual (order_items.product_id es nullOnDelete,
        // la línea guarda el snapshot de nombre/precio).
        if ($category->products()->where('active', true)->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: la categoría tiene productos activos. Reasigná o archivá los productos primero.',
            ], 409);
        }

        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: la categoría tiene subcategorías. Eliminá las subcategorías primero.',
            ], 409);
        }

        $category->delete();

        return response()->noContent();
    }
}

/**
 * Funciones de catálogo para React Query (cliente) y Server Components.
 *
 * Delegan en `lib/data/products`, que ya decide entre API de Laravel (si el
 * backend está activo) o mocks. Se mantienen estos alias por compatibilidad
 * con los hooks de `lib/api/queries`.
 */
export {
  getProducts as fetchProducts,
  getProductBySlug as fetchProduct,
  getCategories as fetchCategories,
} from "@/lib/data/products";

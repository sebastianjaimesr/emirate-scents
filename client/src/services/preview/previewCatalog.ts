/**
 * Catálogo de la VISTA PREVIA (GitHub Pages), que no tiene servidor ni base de datos.
 * Usa los mismos productos DEMO que la semilla de la API (server/prisma/data) y repite
 * en el navegador lo que hace server/src/services/catalogService.ts: filtrar, buscar,
 * ordenar y paginar. Solo se incluye al compilar con VITE_PREVIEW=true.
 */
import { demoProducts, type DemoProduct } from '../../../../server/prisma/data/products.demo'
import { buildSearchText, searchWords } from '../../../../server/src/lib/text'
import {
  PAGE_SIZE,
  type CatalogFacets,
  type CatalogPage,
  type CatalogQuery,
  type SortOption,
} from '../../features/catalog/catalogQuery'
import type { Product } from '../../types/product'
import type { HighlightKind } from '../productService'

const collator = new Intl.Collator('es')

/** Convierte un producto DEMO de los datos de prueba en un Product de la tienda. */
function toProduct(demo: DemoProduct): Product {
  return {
    ...demo,
    images: [],
    publishedAt: new Date(`${demo.publishedAt}T12:00:00Z`).toISOString(),
    isDemo: true,
  }
}

/** Productos DEMO con su texto de búsqueda ya preparado (sin tildes ni mayúsculas). */
const products = demoProducts.map((demo) => ({
  product: toProduct(demo),
  searchText: buildSearchText({
    ...demo,
    brandName: demo.brand.name,
    notesTop: demo.notes?.top,
    notesHeart: demo.notes?.heart,
    notesBase: demo.notes?.base,
  }),
}))

/** Orden de más nuevo a más antiguo; el id desempata. */
const byNewest = (a: Product, b: Product) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)

const comparators: Record<SortOption, (a: Product, b: Product) => number> = {
  destacados: (a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || byNewest(a, b),
  novedades: byNewest,
  'precio-asc': (a, b) => a.price - b.price || a.id.localeCompare(b.id),
  'precio-desc': (a, b) => b.price - a.price || a.id.localeCompare(b.id),
  nombre: (a, b) => collator.compare(a.name, b.name) || a.id.localeCompare(b.id),
}

/** Productos de una categoría (o todos si no se indica). */
const inCategory = (category?: string) =>
  products.filter(({ product }) => !category || product.categorySlug === category)

/**
 * Versión sin servidor de la búsqueda del catálogo: filtra, ordena y pagina los productos DEMO en el navegador.
 */
export async function getProducts(query: CatalogQuery): Promise<CatalogPage> {
  const words = searchWords(query.search)
  const matches = inCategory(query.category)
    .filter(
      ({ product, searchText }) =>
        (query.brands.length === 0 || query.brands.includes(product.brand.slug)) &&
        (query.sizes.length === 0 ||
          (product.sizeMl !== undefined && query.sizes.includes(product.sizeMl))) &&
        (query.families.length === 0 ||
          (product.olfactoryFamily !== undefined &&
            query.families.includes(product.olfactoryFamily))) &&
        (query.minPrice === undefined || product.price >= query.minPrice) &&
        (query.maxPrice === undefined || product.price <= query.maxPrice) &&
        words.every((word) => searchText.includes(word)),
    )
    .map(({ product }) => product)
    .sort(comparators[query.sort])

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const page = Math.min(query.page, totalPages)
  return {
    items: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matches.length,
    page,
    totalPages,
  }
}

/** Cuenta cuántas veces aparece cada valor. */
function countBy<T>(values: T[]) {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

/** Versión sin servidor de los filtros disponibles (marcas, tamaños, familias y rango de precios). */
export async function getCatalogFilters(category?: string): Promise<CatalogFacets> {
  const items = inCategory(category).map(({ product }) => product)
  const brandNames = new Map(items.map((product) => [product.brand.slug, product.brand.name]))
  const prices = items.map((product) => product.price)
  return {
    brands: [...countBy(items.map((product) => product.brand.slug))]
      .map(([slug, count]) => ({ slug, name: brandNames.get(slug) ?? slug, count }))
      .sort((a, b) => collator.compare(a.name, b.name)),
    sizes: [...countBy(items.flatMap((product) => product.sizeMl ?? []))]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value),
    families: [...countBy(items.flatMap((product) => product.olfactoryFamily ?? []))]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => collator.compare(a.value, b.value)),
    priceRange: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  }
}

/** Busca un producto DEMO por slug. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find(({ product }) => product.slug === slug)?.product ?? null
}

/** Productos relacionados: primero de la misma categoría, hasta completar el límite. */
export async function getRelatedProducts(product: Product, limit: number): Promise<Product[]> {
  const sameCategory = inCategory(product.categorySlug)
    .map(({ product: item }) => item)
    .filter((item) => item.id !== product.id)
    .sort(byNewest)
  const sameFamily = product.olfactoryFamily
    ? sameCategory.filter((item) => item.olfactoryFamily === product.olfactoryFamily)
    : []
  return [...sameFamily, ...sameCategory.filter((item) => !sameFamily.includes(item))].slice(
    0,
    limit,
  )
}

/** Productos DEMO con los ids indicados, en el mismo orden. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return ids.flatMap((id) => products.find(({ product }) => product.id === id)?.product ?? [])
}

const highlightFilter: Record<HighlightKind, (product: Product) => boolean> = {
  recomendados: (product) => !!product.isFeatured,
  novedades: (product) => !!product.isNew,
  'mas-vendidos': (product) => !!product.isBestSeller,
}

/** Productos destacados (recomendados, novedades o más vendidos) de los datos DEMO. */
export async function getHighlightedProducts(kind: HighlightKind, limit: number) {
  return products
    .map(({ product }) => product)
    .filter(highlightFilter[kind])
    .sort(byNewest)
    .slice(0, limit)
}

/**
 * Catálogo de la VISTA PREVIA (GitHub Pages), que no tiene servidor ni base de datos.
 * Muestra el catálogo real copiado del Canva (server/prisma/data/products.catalog.ts) y
 * repite en el navegador lo que hace server/src/services/catalogService.ts: filtrar,
 * buscar, ordenar y paginar. Solo se incluye al compilar con VITE_PREVIEW=true.
 */
import {
  catalogProducts,
  type CatalogProduct,
} from '../../../../server/prisma/data/products.catalog'
import { buildSearchText, relevanceScore, searchWords } from '../../../../server/src/lib/text'
import {
  PAGE_SIZE,
  type AudienceSlug,
  type CollectionSlug,
  type CatalogFacets,
  type CatalogPage,
  type CatalogQuery,
  type SortOption,
} from '../../features/catalog/catalogQuery'
import type { Product } from '../../types/product'
import type { HighlightKind } from '../productService'

const collator = new Intl.Collator('es')

/** Convierte un producto del catálogo en un Product de la tienda. */
function toProduct(entry: CatalogProduct): Product {
  return {
    ...entry,
    images: entry.images ?? [],
    publishedAt: new Date(`${entry.publishedAt}T12:00:00Z`).toISOString(),
    isDemo: false,
  }
}

/** Productos del catálogo con su texto de búsqueda ya preparado (sin tildes ni mayúsculas). */
const products = catalogProducts.map((entry) => ({
  product: toProduct(entry),
  searchText: buildSearchText({
    ...entry,
    brandName: entry.brand.name,
    notesTop: entry.notes?.top,
    notesHeart: entry.notes?.heart,
    notesBase: entry.notes?.base,
  }),
}))

/** Orden de más nuevo a más antiguo; el id desempata. */
const byNewest = (a: Product, b: Product) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)

const featuredFirst = (a: Product, b: Product) =>
  Number(!!b.isFeatured) - Number(!!a.isFeatured) || byNewest(a, b)

const comparators: Record<SortOption, (a: Product, b: Product) => number> = {
  destacados: featuredFirst,
  // Con búsqueda, getProducts ordena primero por puntaje; esto solo desempata
  relevancia: featuredFirst,
  novedades: byNewest,
  'precio-asc': (a, b) => a.price - b.price || a.id.localeCompare(b.id),
  'precio-desc': (a, b) => b.price - a.price || a.id.localeCompare(b.id),
  nombre: (a, b) => collator.compare(a.name, b.name) || a.id.localeCompare(b.id),
}

/** Igual que collectionWhere de catalogService.ts: cada colección depende de un dato real. */
const inCollection: Record<CollectionSlug, (product: Product) => boolean> = {
  nuevos: (product) => !!product.isNew,
  'mas-vendidos': (product) => !!product.isBestSeller,
  ofertas: (product) =>
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price,
}

const audienceBySlug: Record<AudienceSlug, Product['audience']> = {
  masculino: 'MASCULINO',
  femenino: 'FEMENINO',
  unisex: 'UNISEX',
}

/** Productos de una categoría (o todos si no se indica). */
const inCategory = (category?: string) =>
  products.filter(({ product }) => !category || product.categorySlug === category)

/**
 * Versión sin servidor de la búsqueda del catálogo: filtra, ordena y pagina los productos del catálogo en el navegador.
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
        (query.audiences.length === 0 ||
          query.audiences.some((slug) => audienceBySlug[slug] === product.audience)) &&
        (!query.collection || inCollection[query.collection](product)) &&
        (query.minPrice === undefined || product.price >= query.minPrice) &&
        (query.maxPrice === undefined || product.price <= query.maxPrice) &&
        words.every((word) => searchText.includes(word)),
    )
    .map(({ product }) => ({
      product,
      score:
        query.sort === 'relevancia'
          ? relevanceScore({ name: product.name, brandName: product.brand.name }, words)
          : 0,
    }))
    .sort((a, b) => b.score - a.score || comparators[query.sort](a.product, b.product))
    .map(({ product }) => product)

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
    audiences: (Object.keys(audienceBySlug) as AudienceSlug[])
      .map((value) => ({
        value,
        count: items.filter((product) => product.audience === audienceBySlug[value]).length,
      }))
      .filter((audience) => audience.count > 0),
    collections: (Object.keys(inCollection) as CollectionSlug[])
      .map((value) => ({ value, count: items.filter(inCollection[value]).length }))
      .filter((collection) => collection.count > 0),
    priceRange: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  }
}

/** Busca un producto por slug. */
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

/** Productos con los ids indicados, en el mismo orden. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return ids.flatMap((id) => products.find(({ product }) => product.id === id)?.product ?? [])
}

const highlightFilter: Record<HighlightKind, (product: Product) => boolean> = {
  recomendados: (product) => !!product.isFeatured,
  novedades: (product) => !!product.isNew,
  'mas-vendidos': (product) => !!product.isBestSeller,
}

/** Productos destacados (recomendados, novedades o más vendidos) del catálogo. */
export async function getHighlightedProducts(kind: HighlightKind, limit: number) {
  return products
    .map(({ product }) => product)
    .filter(highlightFilter[kind])
    .sort(byNewest)
    .slice(0, limit)
}

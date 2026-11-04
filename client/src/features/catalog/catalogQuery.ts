import type { Product } from '../../types/product'

/*
  Lógica pura de los filtros del catálogo: leerlos de la URL y escribirlos de vuelta.
  Filtrar, ordenar y paginar lo hace el servidor (server/src/services/catalogService.ts),
  que recibe estos mismos parámetros.
*/

export const sortOptions = [
  { value: 'destacados', label: 'Destacados' },
  // Solo tiene sentido al buscar: el selector la muestra únicamente si hay búsqueda
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Nombre: A–Z' },
] as const

/** Valores posibles de orden del catálogo. */
export type SortOption = (typeof sortOptions)[number]['value']

export const PAGE_SIZE = 12

/** Géneros en la URL (?genero=masculino) y su nombre en la tienda. */
export const audienceOptions = [
  { value: 'masculino', label: 'Hombres' },
  { value: 'femenino', label: 'Mujeres' },
  { value: 'unisex', label: 'Unisex' },
] as const
export type AudienceSlug = (typeof audienceOptions)[number]['value']

/**
 * Colecciones especiales (?coleccion=nuevos). Cada una depende de un dato real del producto
 * (marcado como nuevo, datos de ventas, precio anterior): sin datos no aparecen.
 */
export const collectionOptions = [
  { value: 'nuevos', label: 'Nuevos lanzamientos' },
  { value: 'mas-vendidos', label: 'Más vendidos' },
  { value: 'ofertas', label: 'Ofertas' },
] as const
export type CollectionSlug = (typeof collectionOptions)[number]['value']

/** Filtros y orden del catálogo, leídos de la URL. */
export interface CatalogQuery {
  search: string
  /** Viene de la ruta (/catalogo/:categorySlug), no de los parámetros. */
  category?: string
  brands: string[]
  sizes: number[]
  families: string[]
  audiences: AudienceSlug[]
  collection?: CollectionSlug
  minPrice?: number
  maxPrice?: number
  sort: SortOption
  page: number
}

/** Una página de resultados del catálogo. */
export interface CatalogPage {
  items: Product[]
  total: number
  page: number
  totalPages: number
}

/** Opciones disponibles para filtrar (con cuántos productos tiene cada una) y el rango de precios. */
export interface CatalogFacets {
  brands: { slug: string; name: string; count: number }[]
  sizes: { value: number; count: number }[]
  families: { value: string; count: number }[]
  /** Solo los géneros que tienen productos. */
  audiences: { value: AudienceSlug; count: number }[]
  /** Solo las colecciones especiales que tienen productos. */
  collections: { value: CollectionSlug; count: number }[]
  priceRange: { min: number; max: number } | null
}

/** Límites que también aplica la API: así un enlace manipulado no provoca un error. */
const MAX_LIST_ITEMS = 20
const MAX_SEARCH_LENGTH = 100
const MAX_PAGE = 10_000
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Convierte "a,b,c" en una lista sin repetidos ni vacíos, con un máximo de elementos. */
function parseList(value: string | null) {
  return value
    ? [
        ...new Set(
          value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ].slice(0, MAX_LIST_ITEMS)
    : []
}

/** Convierte un texto en entero no negativo; undefined si no es válido. */
function parsePositiveInt(value: string | null) {
  if (!value) return undefined
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 && number <= 1_000_000_000 ? number : undefined
}

/** Indica si el texto es una opción de orden válida. */
function isSortOption(value: string | null): value is SortOption {
  return sortOptions.some((option) => option.value === value)
}

const isAudience = (value: string): value is AudienceSlug =>
  audienceOptions.some((option) => option.value === value)
const isCollection = (value: string | null): value is CollectionSlug =>
  collectionOptions.some((option) => option.value === value)

/** Orden por defecto: al buscar, lo más parecido a lo escrito primero; si no, los destacados. */
export const defaultSort = (search: string): SortOption => (search ? 'relevancia' : 'destacados')

/** Convierte la URL (?marca=a,b&orden=precio-asc...) en un objeto de filtros validado. */
export function parseCatalogQuery(params: URLSearchParams, category?: string): CatalogQuery {
  const sort = params.get('orden')
  let minPrice = parsePositiveInt(params.get('precioMin'))
  let maxPrice = parsePositiveInt(params.get('precioMax'))
  // Un rango invertido (mínimo mayor que máximo) se corrige en lugar de dar error
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }
  const search = (params.get('q') ?? '').trim().slice(0, MAX_SEARCH_LENGTH)
  const collection = params.get('coleccion')
  return {
    search,
    category,
    brands: parseList(params.get('marca')).filter((brand) => slugPattern.test(brand)),
    sizes: parseList(params.get('tamano'))
      .map(Number)
      .filter((size) => Number.isInteger(size) && size > 0 && size <= 10_000),
    families: parseList(params.get('familia')).filter((family) => family.length <= 60),
    audiences: parseList(params.get('genero')).filter(isAudience),
    collection: isCollection(collection) ? collection : undefined,
    minPrice,
    maxPrice,
    // "Relevancia" sin búsqueda no ordena nada: se usa el orden por defecto
    sort: isSortOption(sort) && (sort !== 'relevancia' || search) ? sort : defaultSort(search),
    page: Math.min(MAX_PAGE, Math.max(1, parsePositiveInt(params.get('pagina')) ?? 1)),
  }
}

/** Operación inversa: objeto de filtros → parámetros de URL (omite los valores por defecto). */
export function toSearchParams(query: CatalogQuery) {
  const params = new URLSearchParams()
  if (query.search) params.set('q', query.search)
  if (query.brands.length) params.set('marca', query.brands.join(','))
  if (query.sizes.length) params.set('tamano', query.sizes.join(','))
  if (query.families.length) params.set('familia', query.families.join(','))
  if (query.audiences.length) params.set('genero', query.audiences.join(','))
  if (query.collection) params.set('coleccion', query.collection)
  if (query.minPrice !== undefined) params.set('precioMin', String(query.minPrice))
  if (query.maxPrice !== undefined) params.set('precioMax', String(query.maxPrice))
  if (query.sort !== defaultSort(query.search)) params.set('orden', query.sort)
  if (query.page > 1) params.set('pagina', String(query.page))
  return params
}

/** Cuenta cuántos filtros están activos (para el número en el botón de filtros). */
export function countActiveFilters(query: CatalogQuery) {
  return (
    query.brands.length +
    query.sizes.length +
    query.families.length +
    query.audiences.length +
    (query.collection ? 1 : 0) +
    (query.minPrice !== undefined ? 1 : 0) +
    (query.maxPrice !== undefined ? 1 : 0) +
    (query.search ? 1 : 0)
  )
}

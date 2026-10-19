import type { Product } from '../../types/product'

/*
  Lógica pura de los filtros del catálogo: leerlos de la URL y escribirlos de vuelta.
  Filtrar, ordenar y paginar lo hace el servidor (server/src/services/catalogService.ts),
  que recibe estos mismos parámetros.
*/

export const sortOptions = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre: A–Z' },
] as const

/** Valores posibles de orden del catálogo. */
export type SortOption = (typeof sortOptions)[number]['value']

export const PAGE_SIZE = 12

/** Filtros y orden del catálogo, leídos de la URL. */
export interface CatalogQuery {
  search: string
  /** Viene de la ruta (/catalogo/:categorySlug), no de los parámetros. */
  category?: string
  brands: string[]
  sizes: number[]
  families: string[]
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

/** Convierte la URL (?marca=a,b&orden=precio-asc...) en un objeto de filtros validado. */
export function parseCatalogQuery(params: URLSearchParams, category?: string): CatalogQuery {
  const sort = params.get('orden')
  let minPrice = parsePositiveInt(params.get('precioMin'))
  let maxPrice = parsePositiveInt(params.get('precioMax'))
  // Un rango invertido (mínimo mayor que máximo) se corrige en lugar de dar error
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }
  return {
    search: (params.get('q') ?? '').trim().slice(0, MAX_SEARCH_LENGTH),
    category,
    brands: parseList(params.get('marca')).filter((brand) => slugPattern.test(brand)),
    sizes: parseList(params.get('tamano'))
      .map(Number)
      .filter((size) => Number.isInteger(size) && size > 0 && size <= 10_000),
    families: parseList(params.get('familia')).filter((family) => family.length <= 60),
    minPrice,
    maxPrice,
    sort: isSortOption(sort) ? sort : 'destacados',
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
  if (query.minPrice !== undefined) params.set('precioMin', String(query.minPrice))
  if (query.maxPrice !== undefined) params.set('precioMax', String(query.maxPrice))
  if (query.sort !== 'destacados') params.set('orden', query.sort)
  if (query.page > 1) params.set('pagina', String(query.page))
  return params
}

/** Cuenta cuántos filtros están activos (para el número en el botón de filtros). */
export function countActiveFilters(query: CatalogQuery) {
  return (
    query.brands.length +
    query.sizes.length +
    query.families.length +
    (query.minPrice !== undefined ? 1 : 0) +
    (query.maxPrice !== undefined ? 1 : 0) +
    (query.search ? 1 : 0)
  )
}

import type { Product } from '../../types/product'

/*
  Lógica pura del catálogo: leer filtros de la URL, aplicarlos y ordenar.
  "Pura" significa que no depende de React ni del navegador, así que se puede
  probar fácilmente y reutilizar en el servidor (Fase 5).
*/

export const sortOptions = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre: A–Z' },
] as const

export type SortOption = (typeof sortOptions)[number]['value']

export const PAGE_SIZE = 12

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

export interface CatalogPage {
  items: Product[]
  total: number
  page: number
  totalPages: number
}

export interface CatalogFacets {
  brands: { slug: string; name: string; count: number }[]
  sizes: { value: number; count: number }[]
  families: { value: string; count: number }[]
  priceRange: { min: number; max: number } | null
}

/** Quita tildes y mayúsculas para que "ambar" encuentre "Ámbar". */
export function normalizeText(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function parseList(value: string | null) {
  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function parsePositiveInt(value: string | null) {
  if (!value) return undefined
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : undefined
}

function isSortOption(value: string | null): value is SortOption {
  return sortOptions.some((option) => option.value === value)
}

/** Convierte la URL (?marca=a,b&orden=precio-asc...) en un objeto de filtros validado. */
export function parseCatalogQuery(params: URLSearchParams, category?: string): CatalogQuery {
  const sort = params.get('orden')
  return {
    search: params.get('q')?.trim() ?? '',
    category,
    brands: parseList(params.get('marca')),
    sizes: parseList(params.get('tamano'))
      .map(Number)
      .filter((size) => Number.isInteger(size) && size > 0),
    families: parseList(params.get('familia')),
    minPrice: parsePositiveInt(params.get('precioMin')),
    maxPrice: parsePositiveInt(params.get('precioMax')),
    sort: isSortOption(sort) ? sort : 'destacados',
    page: Math.max(1, parsePositiveInt(params.get('pagina')) ?? 1),
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

function matchesSearch(product: Product, search: string) {
  const term = normalizeText(search)
  if (!term) return true
  const haystack = normalizeText(
    [
      product.name,
      product.brand.name,
      product.olfactoryFamily ?? '',
      ...(product.notes
        ? [...product.notes.top, ...product.notes.heart, ...product.notes.base]
        : []),
    ].join(' '),
  )
  // Todas las palabras buscadas deben aparecer: "oud rosa" encuentra productos con ambas
  return term.split(/\s+/).every((word) => haystack.includes(word))
}

const sorters: Record<SortOption, (a: Product, b: Product) => number> = {
  destacados: (a, b) =>
    Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false) ||
    b.publishedAt.localeCompare(a.publishedAt),
  novedades: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  'precio-asc': (a, b) => a.price - b.price,
  'precio-desc': (a, b) => b.price - a.price,
  nombre: (a, b) => a.name.localeCompare(b.name, 'es'),
}

/** Filtra, ordena y pagina una lista de productos según la consulta. */
export function applyCatalogQuery(
  products: Product[],
  query: CatalogQuery,
  pageSize = PAGE_SIZE,
): CatalogPage {
  const filtered = products
    .filter((product) => !query.category || product.categorySlug === query.category)
    .filter((product) => query.brands.length === 0 || query.brands.includes(product.brand.slug))
    .filter(
      (product) =>
        query.sizes.length === 0 ||
        (product.sizeMl !== undefined && query.sizes.includes(product.sizeMl)),
    )
    .filter(
      (product) =>
        query.families.length === 0 ||
        (product.olfactoryFamily !== undefined && query.families.includes(product.olfactoryFamily)),
    )
    .filter((product) => query.minPrice === undefined || product.price >= query.minPrice)
    .filter((product) => query.maxPrice === undefined || product.price <= query.maxPrice)
    .filter((product) => matchesSearch(product, query.search))
    .sort(sorters[query.sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(query.page, totalPages)
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    totalPages,
  }
}

/** Opciones disponibles para los filtros, calculadas a partir de los productos reales. */
export function getCatalogFacets(products: Product[], category?: string): CatalogFacets {
  const scope = products.filter((product) => !category || product.categorySlug === category)

  const brands = new Map<string, { slug: string; name: string; count: number }>()
  const sizes = new Map<number, number>()
  const families = new Map<string, number>()

  for (const product of scope) {
    const brand = brands.get(product.brand.slug) ?? { ...product.brand, count: 0 }
    brand.count += 1
    brands.set(product.brand.slug, brand)
    if (product.sizeMl !== undefined)
      sizes.set(product.sizeMl, (sizes.get(product.sizeMl) ?? 0) + 1)
    if (product.olfactoryFamily)
      families.set(product.olfactoryFamily, (families.get(product.olfactoryFamily) ?? 0) + 1)
  }

  const prices = scope.map((product) => product.price)
  return {
    brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    sizes: [...sizes].map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value),
    families: [...families]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, 'es')),
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  }
}

/**
 * Capa de servicios del catálogo: el ÚNICO lugar del frontend que sabe de dónde
 * vienen los productos. Desde la Fase 5 los pide a la API (server/), que los lee
 * de PostgreSQL. Los componentes no saben nada de URLs ni de fetch.
 *
 * En la vista previa de GitHub Pages (VITE_PREVIEW=true) no hay API: las mismas funciones
 * responden con los productos DEMO desde el navegador (preview/previewCatalog.ts).
 * Vite elimina ese código de la versión normal, así que no pesa en la tienda real.
 */
import type { CatalogFacets, CatalogPage, CatalogQuery } from '../features/catalog/catalogQuery'
import { PAGE_SIZE, parseCatalogQuery, toSearchParams } from '../features/catalog/catalogQuery'
import type { Product } from '../types/product'
import { ApiError, apiGet } from './apiClient'

const isPreview = import.meta.env.VITE_PREVIEW === 'true'
const preview = () => import('./preview/previewCatalog')

interface ItemsResponse<T> {
  items: T[]
}

export async function getProducts(query: CatalogQuery): Promise<CatalogPage> {
  if (isPreview) return (await preview()).getProducts(query)
  // Los parámetros de la API son los mismos que los de la URL de la tienda
  const params = toSearchParams(query)
  if (query.category) params.set('categoria', query.category)
  params.set('porPagina', String(PAGE_SIZE))
  return apiGet<CatalogPage>('/products', params)
}

export async function getCatalogFilters(category?: string): Promise<CatalogFacets> {
  if (isPreview) return (await preview()).getCatalogFilters(category)
  return apiGet<CatalogFacets>('/catalog/filters', { categoria: category })
}

/** null si el producto no existe o no está publicado (la página muestra "no encontrado"). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isPreview) return (await preview()).getProductBySlug(slug)
  try {
    return await apiGet<Product>(`/products/${encodeURIComponent(slug)}`)
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
    throw error
  }
}

/** Productos de la misma categoría, priorizando la misma familia olfativa. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (isPreview) return (await preview()).getRelatedProducts(product, limit)
  const { items } = await apiGet<ItemsResponse<Product>>(
    `/products/${encodeURIComponent(product.slug)}/related`,
    { limite: limit },
  )
  return items
}

/** Varios productos por id, en el mismo orden (para carrito y favoritos). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  if (isPreview) return (await preview()).getProductsByIds(ids)
  const { items } = await apiGet<ItemsResponse<Product>>('/catalog/lookup', { ids: ids.join(',') })
  return items
}

export type HighlightKind = 'recomendados' | 'novedades' | 'mas-vendidos'

/** Selecciones para la página de inicio. Cada una depende de un dato real del producto. */
export async function getHighlightedProducts(kind: HighlightKind, limit = 4): Promise<Product[]> {
  if (isPreview) return (await preview()).getHighlightedProducts(kind, limit)
  const { items } = await apiGet<ItemsResponse<Product>>(`/catalog/highlights/${kind}`, {
    limite: limit,
  })
  return items
}

/**
 * Perfumes de la vitrina del inicio: los primeros del catálogo en su orden por defecto
 * (primero los recomendados por la casa, luego los más recientes).
 */
export async function getShowcaseProducts(limit = 8): Promise<Product[]> {
  const { items } = await getProducts(parseCatalogQuery(new URLSearchParams()))
  return items.slice(0, limit)
}

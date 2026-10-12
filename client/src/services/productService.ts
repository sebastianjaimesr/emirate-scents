/**
 * Capa de servicios del catálogo: el ÚNICO lugar del frontend que sabe de dónde
 * vienen los productos. Hoy lee los datos DEMO; en la Fase 5 estas mismas
 * funciones harán peticiones a la API (fetch('/api/products?...')) y ningún
 * componente tendrá que cambiar.
 */
import { demoProducts } from '../data/demo/products.demo'
import {
  applyCatalogQuery,
  getCatalogFacets,
  type CatalogFacets,
  type CatalogPage,
  type CatalogQuery,
} from '../features/catalog/catalogQuery'
import type { Product } from '../types/product'

const catalog: Product[] = demoProducts

/** Simula la latencia de red para que los estados de carga se vean y se prueben como serán con la API. */
function simulateNetwork<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function getProducts(query: CatalogQuery): Promise<CatalogPage> {
  return simulateNetwork(applyCatalogQuery(catalog, query))
}

export function getCatalogFilters(category?: string): Promise<CatalogFacets> {
  return simulateNetwork(getCatalogFacets(catalog, category), 0)
}

export function getProductBySlug(slug: string): Promise<Product | null> {
  return simulateNetwork(catalog.find((product) => product.slug === slug) ?? null)
}

/** Productos de la misma categoría, priorizando la misma familia olfativa. */
export function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const related = catalog
    .filter((item) => item.id !== product.id && item.categorySlug === product.categorySlug)
    .sort(
      (a, b) =>
        Number(b.olfactoryFamily === product.olfactoryFamily) -
        Number(a.olfactoryFamily === product.olfactoryFamily),
    )
  return simulateNetwork(related.slice(0, limit))
}

/** Varios productos por id, en el mismo orden (para carrito y favoritos). */
export function getProductsByIds(ids: string[]): Promise<Product[]> {
  const byId = new Map(catalog.map((product) => [product.id, product]))
  return simulateNetwork(
    ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product)),
    80,
  )
}

export type HighlightKind = 'recomendados' | 'novedades' | 'mas-vendidos'

/** Selecciones para la página de inicio. Cada una depende de un dato real del producto. */
export function getHighlightedProducts(kind: HighlightKind, limit = 4): Promise<Product[]> {
  const filters: Record<HighlightKind, (product: Product) => boolean> = {
    recomendados: (product) => Boolean(product.isFeatured),
    novedades: (product) => Boolean(product.isNew),
    'mas-vendidos': (product) => Boolean(product.isBestSeller),
  }
  const items = catalog
    .filter(filters[kind])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
  return simulateNetwork(items)
}

/** true mientras el catálogo contenga productos de demostración (muestra el aviso DEMO). */
export const hasDemoProducts = catalog.some((product) => product.isDemo)

/**
 * Modelo de producto del frontend. Coincide con lo que devuelve la API
 * (GET /api/products). Los campos opcionales solo se rellenan con información real:
 * si no se conoce un dato, se omite en lugar de inventarlo.
 */

export type Concentration = 'EXTRAIT' | 'PARFUM' | 'EDP' | 'EDT' | 'EDC' | 'ACEITE' | 'OTRA'

export type Audience = 'FEMENINO' | 'MASCULINO' | 'UNISEX'

export interface Brand {
  slug: string
  name: string
}

export interface ProductImage {
  /** Ruta dentro de /public, por ejemplo /images/products/AR-0001/1.webp */
  url: string
  /** Texto alternativo descriptivo para lectores de pantalla. */
  alt: string
}

export interface OlfactoryNotes {
  top: string[]
  heart: string[]
  base: string[]
}

export interface Product {
  id: string
  /** Código de inventario. Prefijos: AR- árabes, DS- diseñador, NI- nicho, EQ- equivalencias. */
  sku: string
  /** Identificador legible para la URL: /producto/<slug> */
  slug: string
  name: string
  brand: Brand
  categorySlug: string
  shortDescription: string
  description: string
  /** Precio en pesos colombianos, sin decimales. */
  price: number
  /** Precio anterior. Solo si el descuento es real. */
  compareAtPrice?: number
  sizeMl?: number
  concentration?: Concentration
  olfactoryFamily?: string
  notes?: OlfactoryNotes
  audience?: Audience
  /** Solo para equivalencias: perfil olfativo de referencia, nunca presentado como el original. */
  inspirationReference?: string
  images: ProductImage[]
  stock: number
  isNew?: boolean
  isFeatured?: boolean
  /** Solo con datos de ventas reales. */
  isBestSeller?: boolean
  /** Fecha de publicación (ISO 8601); se usa para ordenar por novedades. */
  publishedAt: string
  /** true = producto ficticio de demostración que NO está a la venta. */
  isDemo: boolean
}

export const concentrationLabels: Record<Concentration, string> = {
  EXTRAIT: 'Extrait de parfum',
  PARFUM: 'Parfum',
  EDP: 'Eau de parfum',
  EDT: 'Eau de toilette',
  EDC: 'Eau de cologne',
  ACEITE: 'Aceite perfumado',
  OTRA: 'Otra',
}

export const audienceLabels: Record<Audience, string> = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  UNISEX: 'Unisex',
}

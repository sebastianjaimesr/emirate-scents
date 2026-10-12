import type { Prisma } from '../generated/prisma/client.js'

/** Relaciones que se cargan siempre junto con un producto. */
export const productInclude = {
  brand: { select: { slug: true, name: true } },
  category: { select: { slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.ProductInclude

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>

/**
 * Forma pública de un producto (lo que recibe la tienda). Coincide con el tipo
 * Product de client/src/types/product.ts. Los campos desconocidos se omiten, nunca
 * se rellenan con valores inventados.
 */
export interface ProductDto {
  id: string
  sku: string
  slug: string
  name: string
  brand: { slug: string; name: string }
  categorySlug: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  sizeMl?: number
  concentration?: string
  olfactoryFamily?: string
  notes?: { top: string[]; heart: string[]; base: string[] }
  audience?: string
  inspirationReference?: string
  images: { url: string; alt: string }[]
  stock: number
  isNew?: boolean
  isFeatured?: boolean
  isBestSeller?: boolean
  publishedAt: string
  isDemo: boolean
}

/** Pesos colombianos sin decimales, como los muestra la tienda. */
export function toCOP(value: Prisma.Decimal) {
  return value.toDecimalPlaces(0).toNumber()
}

export function toProductDto(product: ProductWithRelations): ProductDto {
  const hasNotes =
    product.notesTop.length + product.notesHeart.length + product.notesBase.length > 0

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categorySlug: product.category.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: toCOP(product.price),
    ...(product.compareAtPrice && { compareAtPrice: toCOP(product.compareAtPrice) }),
    ...(product.sizeMl !== null && { sizeMl: product.sizeMl }),
    ...(product.concentration && { concentration: product.concentration }),
    ...(product.olfactoryFamily && { olfactoryFamily: product.olfactoryFamily }),
    ...(hasNotes && {
      notes: { top: product.notesTop, heart: product.notesHeart, base: product.notesBase },
    }),
    ...(product.audience && { audience: product.audience }),
    ...(product.inspirationReference && { inspirationReference: product.inspirationReference }),
    images: product.images,
    stock: product.stock,
    ...(product.isNew && { isNew: true }),
    ...(product.isFeatured && { isFeatured: true }),
    ...(product.isBestSeller && { isBestSeller: true }),
    publishedAt: (product.publishedAt ?? product.createdAt).toISOString(),
    isDemo: product.isDemo,
  }
}

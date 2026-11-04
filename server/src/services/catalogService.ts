import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { relevanceScore, searchWords } from '../lib/text.js'
import {
  audienceBySlug,
  type CatalogQuery,
  type CollectionSlug,
  type HighlightKind,
  type SortOption,
} from '../validators/catalog.js'
import { productInclude, toCOP, toProductDto, type ProductDto } from './productMapper.js'

/** La tienda solo ve productos publicados. */
const published = { status: 'PUBLICADO' } satisfies Prisma.ProductWhereInput

// El último criterio (id) hace el orden estable: la paginación nunca repite ni salta productos
const orderBy: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  destacados: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }],
  // Sin búsqueda, "relevancia" equivale a destacados; con búsqueda se ordena en listProducts
  relevancia: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }],
  novedades: [{ publishedAt: 'desc' }, { id: 'asc' }],
  'precio-asc': [{ price: 'asc' }, { id: 'asc' }],
  'precio-desc': [{ price: 'desc' }, { id: 'asc' }],
  nombre: [{ name: 'asc' }, { id: 'asc' }],
}

/** Condición de cada colección especial (siempre sobre un dato real del producto). */
const collectionWhere: Record<CollectionSlug, Prisma.ProductWhereInput> = {
  nuevos: { isNew: true },
  'mas-vendidos': { isBestSeller: true },
  // Oferta = hay un precio anterior y es mayor que el actual
  ofertas: { compareAtPrice: { gt: prisma.product.fields.price } },
}

/** Convierte los filtros del catálogo en la condición "where" de Prisma (solo productos publicados). */
function buildWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  return {
    ...published,
    ...(query.categoria && { category: { slug: query.categoria } }),
    ...(query.marca.length > 0 && { brand: { slug: { in: query.marca } } }),
    ...(query.tamano.length > 0 && { sizeMl: { in: query.tamano } }),
    ...(query.familia.length > 0 && { olfactoryFamily: { in: query.familia } }),
    ...(query.genero.length > 0 && {
      audience: { in: query.genero.map((slug) => audienceBySlug[slug]) },
    }),
    ...(query.coleccion && collectionWhere[query.coleccion]),
    ...((query.precioMin !== undefined || query.precioMax !== undefined) && {
      price: { gte: query.precioMin, lte: query.precioMax },
    }),
    // Todas las palabras buscadas deben aparecer: "oud rosa" encuentra productos con ambas
    AND: searchWords(query.q).map((word) => ({ searchText: { contains: word } })),
  }
}

/** Una página de resultados del catálogo. */
export interface CatalogPage {
  items: ProductDto[]
  total: number
  page: number
  totalPages: number
}

/** Busca productos publicados con filtros, orden y paginación. */
export async function listProducts(query: CatalogQuery): Promise<CatalogPage> {
  const where = buildWhere(query)
  const total = await prisma.product.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / query.porPagina))
  // Si piden una página que ya no existe (por ejemplo, tras filtrar), se devuelve la última
  const page = Math.min(query.pagina, totalPages)
  const words = searchWords(query.q)
  if (query.orden === 'relevancia' && words.length > 0) {
    return { ...(await listByRelevance(where, words, page, query.porPagina)), total, totalPages }
  }
  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: orderBy[query.orden],
    skip: (page - 1) * query.porPagina,
    take: query.porPagina,
  })
  return { items: products.map(toProductDto), total, page, totalPages }
}

/**
 * Orden por relevancia: se puntúan en memoria los productos que coinciden (solo nombre y
 * marca, consulta liviana) y luego se cargan completos los de la página pedida.
 * Un catálogo de perfumería tiene cientos de productos, no millones: es rápido.
 */
async function listByRelevance(
  where: Prisma.ProductWhereInput,
  words: string[],
  page: number,
  pageSize: number,
) {
  const candidates = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      isFeatured: true,
      publishedAt: true,
      brand: { select: { name: true } },
    },
  })
  const ranked = candidates
    .map((product) => ({
      product,
      score: relevanceScore({ name: product.name, brandName: product.brand.name }, words),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
        (b.product.publishedAt?.getTime() ?? 0) - (a.product.publishedAt?.getTime() ?? 0) ||
        a.product.id.localeCompare(b.product.id),
    )
  const ids = ranked.slice((page - 1) * pageSize, page * pageSize).map(({ product }) => product.id)
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productInclude,
  })
  const byId = new Map(products.map((product) => [product.id, product]))
  return {
    page,
    items: ids.flatMap((id) => {
      const product = byId.get(id)
      return product ? [toProductDto(product)] : []
    }),
  }
}

/** Filtros disponibles con su cantidad de productos y el rango de precios. */
export interface CatalogFacets {
  brands: { slug: string; name: string; count: number }[]
  sizes: { value: number; count: number }[]
  families: { value: string; count: number }[]
  /** Solo los géneros con productos (hoy ninguno tiene el dato: la lista queda vacía). */
  audiences: { value: AudienceSlugValue; count: number }[]
  /** Solo las colecciones especiales con productos. */
  collections: { value: CollectionSlug; count: number }[]
  priceRange: { min: number; max: number } | null
}

type AudienceSlugValue = keyof typeof audienceBySlug

const collectionSlugs = Object.keys(collectionWhere) as CollectionSlug[]
const audienceOrder: AudienceSlugValue[] = ['masculino', 'femenino', 'unisex']

/** Opciones de los filtros, calculadas con los productos publicados de la categoría. */
export async function getFacets(categorySlug?: string): Promise<CatalogFacets> {
  const where: Prisma.ProductWhereInput = {
    ...published,
    ...(categorySlug && { category: { slug: categorySlug } }),
  }

  const [brandGroups, sizeGroups, familyGroups, audienceGroups, prices, ...collectionCounts] =
    await Promise.all([
      prisma.product.groupBy({ by: ['brandId'], where, _count: { _all: true } }),
      prisma.product.groupBy({
        by: ['sizeMl'],
        where: { ...where, sizeMl: { not: null } },
        _count: { _all: true },
        orderBy: { sizeMl: 'asc' },
      }),
      prisma.product.groupBy({
        by: ['olfactoryFamily'],
        where: { ...where, olfactoryFamily: { not: null } },
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['audience'],
        where: { ...where, audience: { not: null } },
        _count: { _all: true },
      }),
      prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
      ...collectionSlugs.map((slug) =>
        prisma.product.count({ where: { ...where, ...collectionWhere[slug] } }),
      ),
    ])
  const slugByAudience = new Map(
    Object.entries(audienceBySlug).map(([slug, value]) => [value, slug as AudienceSlugValue]),
  )

  const brands = await prisma.brand.findMany({
    where: { id: { in: brandGroups.map((group) => group.brandId) } },
    select: { id: true, slug: true, name: true },
  })
  const countByBrand = new Map(brandGroups.map((group) => [group.brandId, group._count._all]))
  const collator = new Intl.Collator('es')

  return {
    brands: brands
      .map((brand) => ({
        slug: brand.slug,
        name: brand.name,
        count: countByBrand.get(brand.id) ?? 0,
      }))
      .sort((a, b) => collator.compare(a.name, b.name)),
    sizes: sizeGroups.flatMap((group) =>
      group.sizeMl === null ? [] : [{ value: group.sizeMl, count: group._count._all }],
    ),
    families: familyGroups
      .flatMap((group) =>
        group.olfactoryFamily === null
          ? []
          : [{ value: group.olfactoryFamily, count: group._count._all }],
      )
      .sort((a, b) => collator.compare(a.value, b.value)),
    audiences: audienceGroups
      .flatMap((group) => {
        const value = group.audience && slugByAudience.get(group.audience)
        return value ? [{ value, count: group._count._all }] : []
      })
      .sort((a, b) => audienceOrder.indexOf(a.value) - audienceOrder.indexOf(b.value)),
    collections: collectionSlugs
      .map((value, index) => ({ value, count: collectionCounts[index] ?? 0 }))
      .filter((collection) => collection.count > 0),
    priceRange:
      prices._min.price && prices._max.price
        ? { min: toCOP(prices._min.price), max: toCOP(prices._max.price) }
        : null,
  }
}

/** Busca un producto publicado por slug; null si no existe. */
export async function getProductBySlug(slug: string): Promise<ProductDto | null> {
  const product = await prisma.product.findFirst({
    where: { ...published, slug },
    include: productInclude,
  })
  return product && toProductDto(product)
}

/** Productos de la misma categoría, primero los de la misma familia olfativa. */
export async function getRelatedProducts(
  slug: string,
  limit: number,
): Promise<ProductDto[] | null> {
  const product = await prisma.product.findFirst({
    where: { ...published, slug },
    select: { id: true, categoryId: true, olfactoryFamily: true },
  })
  if (!product) return null

  const sameCategory = { ...published, categoryId: product.categoryId, id: { not: product.id } }
  const sameFamily = product.olfactoryFamily
    ? await prisma.product.findMany({
        where: { ...sameCategory, olfactoryFamily: product.olfactoryFamily },
        include: productInclude,
        orderBy: orderBy.novedades,
        take: limit,
      })
    : []
  const others = await prisma.product.findMany({
    where: { ...sameCategory, id: { notIn: [product.id, ...sameFamily.map((item) => item.id)] } },
    include: productInclude,
    orderBy: orderBy.novedades,
    take: limit - sameFamily.length,
  })
  return [...sameFamily, ...others].map(toProductDto)
}

/** Varios productos por id, en el mismo orden pedido (para carrito y favoritos). */
export async function getProductsByIds(ids: string[]): Promise<ProductDto[]> {
  if (ids.length === 0) return []
  const products = await prisma.product.findMany({
    where: { ...published, id: { in: ids } },
    include: productInclude,
  })
  const byId = new Map(products.map((product) => [product.id, product]))
  return ids.flatMap((id) => {
    const product = byId.get(id)
    return product ? [toProductDto(product)] : []
  })
}

const highlightWhere: Record<HighlightKind, Prisma.ProductWhereInput> = {
  recomendados: { isFeatured: true },
  novedades: { isNew: true },
  'mas-vendidos': { isBestSeller: true },
}

/** Selecciones de la página de inicio. Cada una depende de un dato real del producto. */
export async function getHighlightedProducts(kind: HighlightKind, limit: number) {
  const products = await prisma.product.findMany({
    where: { ...published, ...highlightWhere[kind] },
    include: productInclude,
    orderBy: orderBy.novedades,
    take: limit,
  })
  return products.map(toProductDto)
}

/** Categorías con la cantidad de productos publicados. */
export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { position: 'asc' },
    select: {
      slug: true,
      name: true,
      _count: { select: { products: { where: published } } },
    },
  })
  return categories.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
  }))
}

/** Marcas que tienen al menos un producto publicado. */
export async function listBrands() {
  return prisma.brand.findMany({
    where: { products: { some: published } },
    orderBy: { name: 'asc' },
    select: { slug: true, name: true },
  })
}

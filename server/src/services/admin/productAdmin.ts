import type { Prisma } from '../../generated/prisma/client.js'
import { HttpError, notFound } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { buildSearchText, searchWords } from '../../lib/text.js'
import type {
  AdminProductsQuery,
  CreateProductInput,
  UpdateProductInput,
} from '../../validators/admin.js'
import { toCOP } from '../productMapper.js'

/*
  Productos desde el panel. Reglas:
  - Las existencias solo cambian con movimientos de inventario (inventoryAdmin.ts).
  - Un producto con pedidos o movimientos no se borra: se archiva.
  - Para publicar, el producto debe estar completo (ver publishProblems).
*/

const adminProductInclude = {
  brand: { select: { id: true, slug: true, name: true } },
  category: { select: { id: true, slug: true, name: true } },
  images: {
    select: { id: true, url: true, alt: true, position: true, widths: true },
    orderBy: { position: 'asc' },
  },
  _count: { select: { orderItems: true, inventoryMovements: true } },
} satisfies Prisma.ProductInclude

type AdminProductRecord = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>

/** Convierte un producto de la base en el objeto del panel. */
export function toAdminProduct(product: AdminProductRecord) {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    price: toCOP(product.price),
    compareAtPrice: product.compareAtPrice ? toCOP(product.compareAtPrice) : null,
    sizeMl: product.sizeMl,
    concentration: product.concentration,
    olfactoryFamily: product.olfactoryFamily,
    notesTop: product.notesTop,
    notesHeart: product.notesHeart,
    notesBase: product.notesBase,
    audience: product.audience,
    inspirationReference: product.inspirationReference,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    isLowStock: product.stock <= product.lowStockThreshold,
    status: product.status,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isDemo: product.isDemo,
    images: product.images,
    orderCount: product._count.orderItems,
    movementCount: product._count.inventoryMovements,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

/** Producto del panel (tipo deducido de toAdminProduct). */
export type AdminProduct = ReturnType<typeof toAdminProduct>

const orderBy: Record<AdminProductsQuery['orden'], Prisma.ProductOrderByWithRelationInput[]> = {
  recientes: [{ updatedAt: 'desc' }, { id: 'asc' }],
  nombre: [{ name: 'asc' }, { id: 'asc' }],
  'stock-asc': [{ stock: 'asc' }, { name: 'asc' }],
  'precio-desc': [{ price: 'desc' }, { id: 'asc' }],
}

/** Lista los productos del panel con búsqueda, filtros (estado, categoría, marca) y paginación. */
export async function listAdminProducts(query: AdminProductsQuery) {
  const words = searchWords(query.q)
  const where: Prisma.ProductWhereInput = {
    ...(query.estado && { status: query.estado }),
    ...(query.categoria && { categoryId: query.categoria }),
    ...(query.marca && { brandId: query.marca }),
    ...(query.stock === 'agotado' && { stock: 0 }),
    // El SKU se busca tal cual; el resto, en el texto de búsqueda sin tildes
    ...(words.length > 0 && {
      OR: [
        { sku: { contains: query.q.toUpperCase() } },
        { AND: words.map((word) => ({ searchText: { contains: word } })) },
      ],
    }),
  }

  // "Stock bajo" compara dos columnas del mismo producto: se resuelve con SQL
  if (query.stock === 'bajo') {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Product" WHERE "stock" <= "lowStockThreshold"`
    where.id = { in: rows.map((row) => row.id) }
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: orderBy[query.orden],
      skip: (query.pagina - 1) * query.porPagina,
      take: query.porPagina,
    }),
  ])
  return {
    items: products.map(toAdminProduct),
    total,
    page: query.pagina,
    pageSize: query.porPagina,
    totalPages: Math.max(1, Math.ceil(total / query.porPagina)),
  }
}

/** Busca un producto del panel por id o lanza un error 404. */
export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: adminProductInclude })
  if (!product) throw notFound('Producto no encontrado')
  return toAdminProduct(product)
}

/** Comprueba que la marca y la categoría existen (mensaje claro en lugar de un error de BD). */
async function checkReferences(
  tx: Prisma.TransactionClient,
  refs: { brandId?: string; categoryId?: string },
) {
  if (refs.brandId && !(await tx.brand.findUnique({ where: { id: refs.brandId } }))) {
    throw new HttpError(400, 'INVALID_BRAND', 'La marca elegida no existe')
  }
  if (refs.categoryId && !(await tx.category.findUnique({ where: { id: refs.categoryId } }))) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'La categoría elegida no existe')
  }
}

/** SKU y slug son únicos: se avisa del campo exacto que choca. */
async function checkUnique(
  tx: Prisma.TransactionClient,
  fields: { sku?: string; slug?: string },
  exceptId?: string,
) {
  const notThis = exceptId ? { id: { not: exceptId } } : {}
  if (fields.sku && (await tx.product.findFirst({ where: { sku: fields.sku, ...notThis } }))) {
    throw new HttpError(409, 'DUPLICATE_SKU', `Ya existe un producto con el SKU ${fields.sku}`)
  }
  if (fields.slug && (await tx.product.findFirst({ where: { slug: fields.slug, ...notThis } }))) {
    throw new HttpError(
      409,
      'DUPLICATE_SLUG',
      `Ya existe un producto con la dirección ${fields.slug}`,
    )
  }
}

/**
 * Arma el texto de búsqueda del producto (nombre, marca, familia y notas, sin tildes) para buscar rápido.
 */
async function searchTextFor(
  tx: Prisma.TransactionClient,
  product: {
    name: string
    brandId: string
    olfactoryFamily: string | null
    notesTop: string[]
    notesHeart: string[]
    notesBase: string[]
  },
) {
  const brand = await tx.brand.findUniqueOrThrow({ where: { id: product.brandId } })
  return buildSearchText({ ...product, brandName: brand.name })
}

/**
 * Crea un producto en una transacción: valida que existan la marca y la categoría, que el SKU y el slug
 * no estén repetidos y registra el stock inicial como movimiento de inventario.
 */
export async function createAdminProduct(input: CreateProductInput, adminId: string) {
  const { initialStock, ...fields } = input
  const id = await prisma.$transaction(async (tx) => {
    await checkReferences(tx, fields)
    await checkUnique(tx, fields)
    const product = await tx.product.create({
      data: {
        ...fields,
        status: 'BORRADOR',
        stock: initialStock,
        searchText: await searchTextFor(tx, fields),
        // Las existencias iniciales quedan registradas como una entrada de mercancía
        ...(initialStock > 0 && {
          inventoryMovements: {
            create: {
              type: 'ENTRADA',
              quantity: initialStock,
              stockAfter: initialStock,
              reason: 'Inventario inicial',
              adminId,
            },
          },
        }),
      },
    })
    return product.id
  })
  return getAdminProduct(id)
}

/** Actualiza un producto en una transacción, revisando que no se repitan SKU ni slug. */
export async function updateAdminProduct(id: string, input: UpdateProductInput) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id } })
    if (!current) throw notFound('Producto no encontrado')
    await checkReferences(tx, input)
    await checkUnique(tx, input, id)

    const merged = {
      price: input.price ?? toCOP(current.price),
      compareAtPrice:
        input.compareAtPrice !== undefined
          ? input.compareAtPrice
          : current.compareAtPrice && toCOP(current.compareAtPrice),
    }
    if (merged.compareAtPrice != null && merged.compareAtPrice <= merged.price) {
      throw new HttpError(
        400,
        'INVALID_COMPARE_AT_PRICE',
        'El precio anterior debe ser mayor que el precio actual (solo si el descuento es real)',
      )
    }

    const next = { ...current, ...input }
    const updated = await tx.product.update({
      where: { id },
      data: { ...input, searchText: await searchTextFor(tx, next) },
    })
    // Un producto publicado debe seguir completo después de editarlo
    if (updated.status === 'PUBLICADO') {
      const problems = await publishProblems(tx, id)
      if (problems.length > 0) throw incompleteError(problems)
    }
  })
  return getAdminProduct(id)
}

/** Lo que le falta a un producto para poder publicarse. Vacío = se puede publicar. */
async function publishProblems(tx: Prisma.TransactionClient, id: string) {
  const product = await tx.product.findUniqueOrThrow({ where: { id } })
  const problems: string[] = []
  if (product.price.lte(0)) problems.push('El precio debe ser mayor que 0')
  if (!product.shortDescription) problems.push('Falta la descripción corta')
  if (!product.description) problems.push('Falta la descripción')
  return problems
}

/** Error 400 cuando falta información para publicar un producto. */
const incompleteError = (problems: string[]) =>
  new HttpError(
    400,
    'INCOMPLETE_PRODUCT',
    `No se puede publicar todavía: ${problems.join('; ').toLowerCase()}`,
  )

/** Cambia el estado de publicación; para publicar revisa que el producto esté completo. */
export async function setProductStatus(id: string, status: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO') {
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } })
    if (!product) throw notFound('Producto no encontrado')
    if (status === 'PUBLICADO') {
      const problems = await publishProblems(tx, id)
      if (problems.length > 0) throw incompleteError(problems)
    }
    await tx.product.update({
      where: { id },
      data: {
        status,
        // La fecha de publicación se fija la primera vez (ordena las "novedades")
        ...(status === 'PUBLICADO' && !product.publishedAt && { publishedAt: new Date() }),
      },
    })
  })
  return getAdminProduct(id)
}

/**
 * Borra un producto solo si nunca se vendió ni tuvo movimientos de inventario. Si los tiene,
 * responde 409 y propone archivarlo: así los pedidos y el historial siguen intactos.
 * Devuelve las carpetas de fotos subidas para que el controlador las elimine.
 */
export async function deleteAdminProduct(id: string) {
  return prisma.$transaction(async (tx) => {
    // Consultas de una en una: dentro de una transacción comparten la misma conexión
    const product = await tx.product.findUnique({
      where: { id },
      select: { _count: { select: { orderItems: true, inventoryMovements: true } } },
    })
    if (!product) throw notFound('Producto no encontrado')
    if (product._count.orderItems > 0 || product._count.inventoryMovements > 0) {
      throw new HttpError(
        409,
        'PRODUCT_HAS_HISTORY',
        'Este producto tiene pedidos o movimientos de inventario: archívalo en lugar de borrarlo',
      )
    }
    const images = await tx.productImage.findMany({
      where: { productId: id },
      select: { storageKey: true },
    })
    await tx.product.delete({ where: { id } })
    return images.flatMap((image) => (image.storageKey ? [image.storageKey] : []))
  })
}

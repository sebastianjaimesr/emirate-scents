import type { Prisma } from '../../generated/prisma/client.js'
import { HttpError, notFound } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { InventoryMovementInput, MovementsQuery } from '../../validators/admin.js'

/*
  Inventario. Cada cambio de existencias es un movimiento que queda en el historial
  (InventoryMovement), y la base de datos no deja editarlo ni borrarlo.
*/

/**
 * Suma o resta unidades a un producto en una sola instrucción de base de datos que solo se
 * aplica si el resultado no queda por debajo de cero. Dos operaciones simultáneas sobre el
 * mismo producto se ejecutan una detrás de otra (PostgreSQL bloquea la fila), así que nunca
 * se descuentan unidades que ya no existen. Devuelve las existencias resultantes, o null si
 * no alcanzan.
 */
export async function changeStock(tx: Prisma.TransactionClient, productId: string, delta: number) {
  const rows = await tx.$queryRaw<{ stock: number }[]>`
    UPDATE "Product"
    SET "stock" = "stock" + ${delta}, "updatedAt" = now()
    WHERE "id" = ${productId} AND "stock" + ${delta} >= 0
    RETURNING "stock"`
  return rows[0]?.stock ?? null
}

/**
 * Registra una entrada o un ajuste de inventario en una transacción: actualiza el stock
 * (sin dejarlo negativo) y guarda el movimiento con el stock resultante.
 */
export async function recordMovement(input: InventoryMovementInput, adminId: string) {
  const movementId = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { id: true, stock: true },
    })
    if (!product) throw notFound('Producto no encontrado')

    const stockAfter = await changeStock(tx, product.id, input.quantity)
    if (stockAfter === null) {
      // Se vuelve a leer: otra operación pudo cambiar las existencias mientras tanto
      const { stock } = await tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { stock: true },
      })
      throw new HttpError(
        409,
        'INSUFFICIENT_STOCK',
        `No hay suficientes unidades: quedan ${stock} y el ajuste resta ${-input.quantity}`,
      )
    }

    const movement = await tx.inventoryMovement.create({
      data: { ...input, stockAfter, adminId },
      select: { id: true },
    })
    return movement.id
  })
  // Los datos relacionados se leen después: dentro de la transacción, de una consulta en una
  const movement = await prisma.inventoryMovement.findUniqueOrThrow({
    where: { id: movementId },
    include: movementInclude,
  })
  return toMovementDto(movement)
}

const movementInclude = {
  product: { select: { id: true, sku: true, name: true } },
  admin: { select: { name: true } },
  order: { select: { number: true } },
} satisfies Prisma.InventoryMovementInclude

type MovementRecord = Prisma.InventoryMovementGetPayload<{ include: typeof movementInclude }>

/** Convierte un movimiento de la base en el objeto que devuelve la API. */
export function toMovementDto(movement: MovementRecord) {
  return {
    id: movement.id,
    product: movement.product,
    type: movement.type,
    quantity: movement.quantity,
    stockAfter: movement.stockAfter,
    reason: movement.reason,
    adminName: movement.admin?.name ?? null,
    orderId: movement.orderId,
    orderNumber: movement.order?.number ?? null,
    createdAt: movement.createdAt.toISOString(),
  }
}

/** Lista los movimientos de inventario con filtros por producto y tipo, paginados. */
export async function listMovements(query: MovementsQuery) {
  const where: Prisma.InventoryMovementWhereInput = {
    ...(query.producto && { productId: query.producto }),
    ...(query.tipo && { type: query.tipo }),
  }
  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      include: movementInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.pagina - 1) * query.porPagina,
      take: query.porPagina,
    }),
  ])
  return {
    items: movements.map(toMovementDto),
    total,
    page: query.pagina,
    pageSize: query.porPagina,
    totalPages: Math.max(1, Math.ceil(total / query.porPagina)),
  }
}

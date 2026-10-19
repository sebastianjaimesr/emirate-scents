import type { OrderStatus, Prisma } from '../../generated/prisma/client.js'
import { HttpError, notFound } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { OrdersQuery } from '../../validators/admin.js'
import { formatOrderNumber } from '../orderService.js'
import { toCOP } from '../productMapper.js'
import { changeStock, toMovementDto } from './inventoryAdmin.js'

/*
  Pedidos en el panel.

  Regla de existencias (plan de la Fase 1, sección 3.5):
  - Un pedido nuevo NO descuenta: queda pendiente hasta que el negocio lo confirma por WhatsApp.
  - Al pasar a CONFIRMADO se descuentan sus unidades (una VENTA por producto en el historial) y
    se guarda la fecha en stockDeductedAt. Los estados siguientes no vuelven a descontar.
  - Al CANCELAR un pedido ya descontado, las unidades vuelven (una DEVOLUCION por producto).
  Todo ocurre en una transacción: o se aplica completo o no se aplica nada.
*/

/** Estados a los que puede pasar cada estado. Entregado y cancelado son finales. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE_CONFIRMACION: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_PREPARACION', 'ENVIADO', 'CANCELADO'],
  EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
  // Cancelar un pedido enviado cubre la devolución de la transportadora (pago contra entrega rechazado)
  ENVIADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
}

/** Estados en los que aún se puede fijar o cambiar el costo de envío. */
const SHIPPING_EDITABLE: OrderStatus[] = [
  'PENDIENTE_CONFIRMACION',
  'CONFIRMADO',
  'EN_PREPARACION',
  'ENVIADO',
]

/**
 * Error 409 cuando el pedido cambió mientras el administrador lo editaba (por ejemplo, desde otra pestaña).
 */
const orderChanged = () =>
  new HttpError(
    409,
    'ORDER_CHANGED',
    'El pedido cambió mientras tanto (quizá desde otra pestaña). Recarga la página.',
  )

// ── Lista ──────────────────────────────────────────────────────────────────────────────

/** "ES-2026-000123", "000123" o "123" → 123. */
function parseOrderNumber(q: string) {
  const match = /^(?:ES-\d{4}-)?0*(\d{1,9})$/i.exec(q.trim())
  return match ? Number(match[1]) : null
}

/**
 * Lista los pedidos del panel: búsqueda por número, nombre o teléfono, filtro por estado y paginación.
 */
export async function listAdminOrders(query: OrdersQuery) {
  const q = query.q
  const number = q ? parseOrderNumber(q) : null
  const digits = q.replace(/\D/g, '')
  const search: Prisma.OrderWhereInput | undefined = q
    ? {
        OR: [
          ...(number !== null ? [{ number }] : []),
          { customerName: { contains: q, mode: 'insensitive' as const } },
          { city: { contains: q, mode: 'insensitive' as const } },
          ...(digits.length >= 4 ? [{ customerPhone: { contains: digits.slice(-10) } }] : []),
        ],
      }
    : undefined
  const where: Prisma.OrderWhereInput = {
    ...search,
    ...(query.estado && { status: query.estado }),
  }

  const [total, orders, byStatus] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
      skip: (query.pagina - 1) * query.porPagina,
      take: query.porPagina,
      include: { items: { select: { quantity: true } } },
    }),
    // Cuántos hay en cada estado con la misma búsqueda: las pestañas del panel lo muestran
    prisma.order.groupBy({ by: ['status'], where: search ?? {}, _count: { _all: true } }),
  ])

  return {
    items: orders.map((order) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order.number, order.createdAt),
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      city: order.city,
      department: order.department,
      paymentMethod: order.paymentMethod,
      units: order.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: toCOP(order.subtotal),
      shippingCost: order.shippingCost === null ? null : toCOP(order.shippingCost),
      total: toCOP(order.total),
      createdAt: order.createdAt.toISOString(),
    })),
    countsByStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
    total,
    page: query.pagina,
    pageSize: query.porPagina,
    totalPages: Math.max(1, Math.ceil(total / query.porPagina)),
  }
}

// ── Detalle ────────────────────────────────────────────────────────────────────────────

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { id: 'asc' },
        include: {
          product: { select: { id: true, sku: true, name: true, stock: true, status: true } },
        },
      },
      statusChanges: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { admin: { select: { name: true } } },
      },
      inventoryMovements: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: {
          product: { select: { id: true, sku: true, name: true } },
          admin: { select: { name: true } },
          order: { select: { number: true } },
        },
      },
    },
  })
  if (!order) throw notFound('Pedido no encontrado')

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.number, order.createdAt),
    status: order.status,
    allowedTransitions: ORDER_TRANSITIONS[order.status],
    shippingEditable: SHIPPING_EDITABLE.includes(order.status),
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      department: order.department,
      city: order.city,
      address: order.address,
      notes: order.notes,
    },
    paymentMethod: order.paymentMethod,
    items: order.items.map((item) => ({
      id: item.id,
      // Datos del momento del pedido: no cambian aunque luego se edite el producto
      name: item.productNameSnapshot,
      brandName: item.brandNameSnapshot,
      sku: item.skuSnapshot,
      sizeMl: item.sizeMlSnapshot,
      unitPrice: toCOP(item.unitPrice),
      quantity: item.quantity,
      lineTotal: toCOP(item.lineTotal),
      // El producto hoy (para ver si alcanzan las existencias antes de confirmar)
      product: item.product,
    })),
    subtotal: toCOP(order.subtotal),
    shippingCost: order.shippingCost === null ? null : toCOP(order.shippingCost),
    total: toCOP(order.total),
    stockDeductedAt: order.stockDeductedAt?.toISOString() ?? null,
    dataConsentAt: order.dataConsentAt.toISOString(),
    privacyPolicyVersion: order.privacyPolicyVersion,
    history: order.statusChanges.map((change) => ({
      id: change.id,
      fromStatus: change.fromStatus,
      toStatus: change.toStatus,
      note: change.note,
      adminName: change.admin?.name ?? null,
      createdAt: change.createdAt.toISOString(),
    })),
    movements: order.inventoryMovements.map(toMovementDto),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

// ── Cambio de estado ───────────────────────────────────────────────────────────────────

export interface StockShortage {
  sku: string
  name: string
  requested: number
  available: number
}

/** Faltan unidades para confirmar: el panel muestra qué productos y cuántas quedan. */
export class OrderStockShortageError extends HttpError {
  constructor(readonly shortages: StockShortage[]) {
    super(
      409,
      'INSUFFICIENT_STOCK',
      'No hay unidades suficientes para confirmar el pedido: ' +
        shortages
          .map((s) => `${s.name} (${s.sku}) pide ${s.requested} y quedan ${s.available}`)
          .join('; '),
    )
  }
}

/**
 * Cambia el estado de un pedido en una transacción: verifica que el cambio esté permitido,
 * devuelve el stock si se cancela y guarda el cambio en el historial.
 */
export async function changeOrderStatus(
  id: string,
  input: { status: OrderStatus; note: string },
  adminId: string,
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: { id: true, number: true, status: true, stockDeductedAt: true, createdAt: true },
    })
    if (!order) throw notFound('Pedido no encontrado')
    if (!ORDER_TRANSITIONS[order.status].includes(input.status)) {
      throw new HttpError(
        409,
        'INVALID_TRANSITION',
        order.status === input.status
          ? 'El pedido ya está en ese estado'
          : 'Ese cambio de estado no está permitido',
      )
    }

    const deduct = input.status === 'CONFIRMADO' && order.stockDeductedAt === null
    const restore = input.status === 'CANCELADO' && order.stockDeductedAt !== null

    // Primero se "reclama" el pedido: la actualización solo se aplica si sigue en el estado
    // leído. Si dos personas lo confirman a la vez, PostgreSQL bloquea la fila, la segunda
    // espera, ve el estado nuevo y no actualiza nada: así nunca se descuenta dos veces.
    const claimed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: {
        status: input.status,
        ...(deduct && { stockDeductedAt: new Date() }),
        ...(restore && { stockDeductedAt: null }),
      },
    })
    if (claimed.count === 0) throw orderChanged()

    if (deduct || restore) {
      const orderNumber = formatOrderNumber(order.number, order.createdAt)
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true, quantity: true, productNameSnapshot: true, skuSnapshot: true },
      })
      // Un renglón por producto, en orden fijo: dos pedidos con los mismos productos bloquean
      // las filas en el mismo orden y no pueden quedarse esperando el uno al otro
      const lines = new Map<string, { quantity: number; name: string; sku: string }>()
      for (const item of items) {
        if (!item.productId) {
          throw new HttpError(
            409,
            'PRODUCT_MISSING',
            `El producto ${item.productNameSnapshot} (${item.skuSnapshot}) ya no existe`,
          )
        }
        const line = lines.get(item.productId)
        if (line) line.quantity += item.quantity
        else
          lines.set(item.productId, {
            quantity: item.quantity,
            name: item.productNameSnapshot,
            sku: item.skuSnapshot,
          })
      }
      const sorted = [...lines].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

      const shortages: StockShortage[] = []
      const applied: { productId: string; quantity: number; stockAfter: number }[] = []
      for (const [productId, line] of sorted) {
        const delta = deduct ? -line.quantity : line.quantity
        const stockAfter = await changeStock(tx, productId, delta)
        if (stockAfter === null) {
          const { stock } = await tx.product.findUniqueOrThrow({
            where: { id: productId },
            select: { stock: true },
          })
          shortages.push({
            sku: line.sku,
            name: line.name,
            requested: line.quantity,
            available: stock,
          })
        } else {
          applied.push({ productId, quantity: delta, stockAfter })
        }
      }
      // Si falta algo, se lanza el error y la transacción deshace todo (también el estado)
      if (shortages.length > 0) throw new OrderStockShortageError(shortages)

      for (const movement of applied) {
        await tx.inventoryMovement.create({
          data: {
            ...movement,
            type: deduct ? 'VENTA' : 'DEVOLUCION',
            reason: deduct
              ? `Pedido ${orderNumber} confirmado`
              : `Pedido ${orderNumber} cancelado: ${input.note}`,
            orderId: id,
            adminId,
          },
        })
      }
    }

    await tx.orderStatusChange.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: input.status,
        note: input.note || null,
        adminId,
      },
    })
  })
  return getAdminOrder(id)
}

// ── Costo de envío ─────────────────────────────────────────────────────────────────────

/** Fija el costo de envío (null = pendiente de cotización) y recalcula el total. */
export async function setOrderShipping(id: string, shippingCost: number | null) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: { status: true, subtotal: true },
    })
    if (!order) throw notFound('Pedido no encontrado')
    if (!SHIPPING_EDITABLE.includes(order.status)) {
      throw new HttpError(
        409,
        'ORDER_CLOSED',
        'El pedido ya está cerrado: no se puede cambiar el costo de envío',
      )
    }
    const updated = await tx.order.updateMany({
      where: { id, status: order.status },
      data: {
        shippingCost,
        total: shippingCost === null ? order.subtotal : order.subtotal.add(shippingCost),
      },
    })
    if (updated.count === 0) throw orderChanged()
  })
  return getAdminOrder(id)
}

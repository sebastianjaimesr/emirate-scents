import { prisma } from '../../lib/prisma.js'
import { formatOrderNumber } from '../orderService.js'
import { toCOP } from '../productMapper.js'
import { toMovementDto } from './inventoryAdmin.js'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Resumen del panel. Todas las cifras salen de la base de datos en el momento de la consulta:
 * si no hay pedidos, el resumen dice 0, nunca un número de ejemplo.
 */
export async function getDashboard() {
  const since30 = new Date(Date.now() - 30 * DAY_MS)
  const [productsByStatus, lowStockRows, ordersByStatus, recentOrders, movements, sales] =
    await Promise.all([
      prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
      // Stock bajo: compara dos columnas del mismo producto; los archivados no cuentan
      prisma.$queryRaw<
        { id: string; sku: string; name: string; stock: number; lowStockThreshold: number }[]
      >`
        SELECT "id", "sku", "name", "stock", "lowStockThreshold" FROM "Product"
        WHERE "status" <> 'ARCHIVADO' AND "stock" <= "lowStockThreshold"
        ORDER BY "stock" ASC, "name" ASC`,
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          number: true,
          status: true,
          customerName: true,
          city: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.inventoryMovement.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 8,
        include: {
          product: { select: { id: true, sku: true, name: true } },
          admin: { select: { name: true } },
          order: { select: { number: true } },
        },
      }),
      // Pedidos confirmados por el negocio en los últimos 30 días (no cuenta pendientes ni cancelados)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: since30 },
          status: { in: ['CONFIRMADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'] },
        },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ])

  const countBy = <T extends string>(rows: { status: T; _count: { _all: number } }[]) =>
    Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Partial<
      Record<T, number>
    >

  return {
    generatedAt: new Date().toISOString(),
    products: {
      byStatus: countBy(productsByStatus),
      lowStockCount: lowStockRows.length,
      outOfStockCount: lowStockRows.filter((row) => row.stock === 0).length,
      lowStock: lowStockRows.slice(0, 8),
    },
    orders: {
      byStatus: countBy(ordersByStatus),
      pendingCount: countBy(ordersByStatus).PENDIENTE_CONFIRMACION ?? 0,
      recent: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: formatOrderNumber(order.number, order.createdAt),
        status: order.status,
        customerName: order.customerName,
        city: order.city,
        total: toCOP(order.total),
        createdAt: order.createdAt.toISOString(),
      })),
      confirmedLast30Days: {
        count: sales._count._all,
        total: sales._sum.total ? toCOP(sales._sum.total) : 0,
      },
    },
    recentMovements: movements.map(toMovementDto),
  }
}

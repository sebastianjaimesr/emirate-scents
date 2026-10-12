import { PRIVACY_POLICY_VERSION } from '../config/policies.js'
import { Prisma } from '../generated/prisma/client.js'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'
import type { CreateOrderInput } from '../validators/order.js'
import { toCOP } from './productMapper.js'

export type UnavailableReason = 'NOT_FOUND' | 'DEMO_PRODUCT' | 'SOLD_OUT' | 'INSUFFICIENT_STOCK'

export interface UnavailableItem {
  productId: string
  reason: UnavailableReason
  /** Unidades disponibles, cuando hay menos de las pedidas. */
  available?: number
}

/** Uno o más productos no se pueden pedir: la tienda muestra cuáles y por qué. */
export class OrderItemsUnavailableError extends HttpError {
  constructor(readonly items: UnavailableItem[]) {
    super(409, 'ITEMS_UNAVAILABLE', 'Algunos productos no están disponibles')
  }
}

/** ES-2026-000123: año de creación (hora de Colombia) y consecutivo. */
export function formatOrderNumber(number: number, createdAt: Date) {
  const year = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(createdAt)
  return `ES-${year}-${String(number).padStart(6, '0')}`
}

/**
 * Registra un pedido. Regla de oro: del navegador solo se usan los ids y las cantidades;
 * precios, nombres y existencias salen de la base de datos, y el total se calcula aquí.
 *
 * Las existencias se comprueban pero NO se descuentan: el pedido queda pendiente de
 * confirmación por WhatsApp y el negocio las descuenta al confirmarlo.
 */
export async function createOrder(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) }, status: 'PUBLICADO' },
      include: { brand: { select: { name: true } } },
    })
    const byId = new Map(products.map((product) => [product.id, product]))

    const unavailable: UnavailableItem[] = []
    for (const item of input.items) {
      const product = byId.get(item.productId)
      if (!product) unavailable.push({ productId: item.productId, reason: 'NOT_FOUND' })
      else if (product.isDemo)
        unavailable.push({ productId: item.productId, reason: 'DEMO_PRODUCT' })
      else if (product.stock <= 0)
        unavailable.push({ productId: item.productId, reason: 'SOLD_OUT' })
      else if (product.stock < item.quantity) {
        unavailable.push({
          productId: item.productId,
          reason: 'INSUFFICIENT_STOCK',
          available: product.stock,
        })
      }
    }
    if (unavailable.length > 0) throw new OrderItemsUnavailableError(unavailable)

    const lines = input.items.map((item) => {
      const product = byId.get(item.productId)!
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        brandNameSnapshot: product.brand.name,
        skuSnapshot: product.sku,
        sizeMlSnapshot: product.sizeMl,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: product.price.mul(item.quantity),
      }
    })
    const subtotal = lines.reduce((sum, line) => sum.add(line.lineTotal), new Prisma.Decimal(0))

    const order = await tx.order.create({
      data: {
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        department: input.customer.department,
        city: input.customer.city,
        address: input.customer.address,
        notes: input.customer.notes,
        paymentMethod: input.paymentMethod,
        subtotal,
        // Envío pendiente de cotización: el total por ahora es el subtotal
        shippingCost: null,
        total: subtotal,
        dataConsentAt: new Date(),
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        items: { create: lines },
      },
      include: { items: true },
    })

    return {
      orderNumber: formatOrderNumber(order.number, order.createdAt),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
      customer: {
        name: order.customerName,
        department: order.department,
        city: order.city,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.productNameSnapshot,
        brandName: item.brandNameSnapshot,
        sku: item.skuSnapshot,
        ...(item.sizeMlSnapshot !== null && { sizeMl: item.sizeMlSnapshot }),
        quantity: item.quantity,
        unitPrice: toCOP(item.unitPrice),
        lineTotal: toCOP(item.lineTotal),
      })),
      subtotal: toCOP(order.subtotal),
      shippingCost: null,
      total: toCOP(order.total),
    }
  })
}

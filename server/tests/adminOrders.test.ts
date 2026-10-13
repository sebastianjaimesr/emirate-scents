import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { formatOrderNumber } from '../src/services/orderService.js'
import { createTestAdmin, loggedInAgent, PANEL_ORIGIN } from './adminHelpers.js'
import { purgeInventory, resetCatalog } from './fixtures.js'

/* Pedidos desde el panel: lista, detalle, estados, existencias y costo de envío. */

const app = createApp()
let agent: Awaited<ReturnType<typeof loggedInAgent>>

beforeAll(async () => {
  await resetCatalog()
  await createTestAdmin()
  agent = await loggedInAgent(app)
})
afterAll(() => prisma.$disconnect())

const patch = (url: string) => agent.patch(url).set('Origin', PANEL_ORIGIN)
const setStatus = (id: string, status: string, note?: string) =>
  patch(`/api/admin/orders/${id}/status`).send({ status, ...(note !== undefined && { note }) })

/**
 * Crea un pedido directamente en la base de datos, con la copia de nombre y precio que haría
 * la tienda (POST /api/orders tiene un límite de 10 pedidos cada 15 minutos por IP).
 */
async function createOrder(
  lines: { productId: string; quantity: number }[],
  customer: { name?: string; phone?: string; city?: string } = {},
) {
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
    include: { brand: true },
  })
  const items = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId)!
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      brandNameSnapshot: product.brand.name,
      skuSnapshot: product.sku,
      sizeMlSnapshot: product.sizeMl,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal: product.price.mul(line.quantity),
    }
  })
  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0)
  return prisma.order.create({
    data: {
      customerName: customer.name ?? 'Ana Gómez',
      customerPhone: customer.phone ?? '3174096898',
      department: 'Antioquia',
      city: customer.city ?? 'Medellín',
      address: 'Calle 10 # 20-30',
      paymentMethod: 'CONTRA_ENTREGA',
      subtotal,
      total: subtotal,
      dataConsentAt: new Date(),
      privacyPolicyVersion: 'prueba',
      items: { create: items },
    },
  })
}

const stockOf = async (id: string) =>
  (await prisma.product.findUniqueOrThrow({ where: { id }, select: { stock: true } })).stock

async function resetOrders() {
  await purgeInventory()
  await prisma.order.deleteMany()
  // Todas las existencias de los productos de prueba vuelven a 5
  await prisma.product.updateMany({ data: { stock: 5 } })
}

describe('lista y detalle', () => {
  beforeEach(resetOrders)

  it('busca por número, nombre, celular y ciudad, y filtra por estado', async () => {
    const ana = await createOrder([{ productId: 'p1', quantity: 1 }])
    await createOrder([{ productId: 'p2', quantity: 2 }], {
      name: 'Luis Pérez',
      phone: '3001234567',
      city: 'Cali',
    })
    await prisma.order.update({ where: { id: ana.id }, data: { status: 'CONFIRMADO' } })

    const all = await agent.get('/api/admin/orders')
    expect(all.status).toBe(200)
    expect(all.body.total).toBe(2)
    expect(all.body.items[0]).toMatchObject({ customerName: 'Luis Pérez', units: 2, total: 600000 })
    expect(all.body.countsByStatus).toEqual({ PENDIENTE_CONFIRMACION: 1, CONFIRMADO: 1 })

    const number = formatOrderNumber(ana.number, ana.createdAt)
    for (const q of [number, String(ana.number), 'ana g', '317 409', 'medell']) {
      const res = await agent.get('/api/admin/orders').query({ q })
      expect(
        res.body.items.map((o: { id: string }) => o.id),
        q,
      ).toEqual([ana.id])
    }

    const confirmed = await agent.get('/api/admin/orders').query({ estado: 'CONFIRMADO' })
    expect(confirmed.body.items.map((o: { id: string }) => o.id)).toEqual([ana.id])
    // Las pestañas cuentan todos los estados aunque haya un filtro de estado
    expect(confirmed.body.countsByStatus).toEqual({ PENDIENTE_CONFIRMACION: 1, CONFIRMADO: 1 })
  })

  it('muestra los precios del momento del pedido aunque el producto cambie después', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 2 }])
    await prisma.product.update({ where: { id: 'p1' }, data: { price: 999000, name: 'Otro' } })

    const res = await agent.get(`/api/admin/orders/${order.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: 'PENDIENTE_CONFIRMACION',
      allowedTransitions: ['CONFIRMADO', 'CANCELADO'],
      shippingEditable: true,
      customer: { name: 'Ana Gómez', phone: '3174096898', city: 'Medellín' },
      subtotal: 400000,
      shippingCost: null,
      total: 400000,
      stockDeductedAt: null,
      history: [],
      movements: [],
    })
    expect(res.body.items[0]).toMatchObject({
      name: 'Ámbar Real',
      unitPrice: 200000,
      quantity: 2,
      lineTotal: 400000,
      product: { id: 'p1', stock: 5 },
    })
    await prisma.product.update({
      where: { id: 'p1' },
      data: { price: 200000, name: 'Ámbar Real' },
    })
  })

  it('responde 404 a un pedido que no existe', async () => {
    expect((await agent.get('/api/admin/orders/no-existe')).status).toBe(404)
  })
})

describe('estados y existencias', () => {
  beforeEach(resetOrders)

  it('al confirmar descuenta las existencias una sola vez y lo deja en el historial', async () => {
    const order = await createOrder([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ])

    const res = await setStatus(order.id, 'CONFIRMADO', 'Confirmado por WhatsApp')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CONFIRMADO')
    expect(res.body.stockDeductedAt).not.toBeNull()
    expect(res.body.allowedTransitions).toEqual(['EN_PREPARACION', 'ENVIADO', 'CANCELADO'])
    expect(res.body.history).toEqual([
      expect.objectContaining({
        fromStatus: 'PENDIENTE_CONFIRMACION',
        toStatus: 'CONFIRMADO',
        note: 'Confirmado por WhatsApp',
        adminName: 'Admin Prueba',
      }),
    ])
    expect(await stockOf('p1')).toBe(3)
    expect(await stockOf('p2')).toBe(4)

    const movements = await prisma.inventoryMovement.findMany({
      where: { orderId: order.id },
      orderBy: { productId: 'asc' },
    })
    expect(movements).toMatchObject([
      { productId: 'p1', type: 'VENTA', quantity: -2, stockAfter: 3 },
      { productId: 'p2', type: 'VENTA', quantity: -1, stockAfter: 4 },
    ])
    expect(movements[0]!.reason).toContain(formatOrderNumber(order.number, order.createdAt))

    // Los estados siguientes no vuelven a descontar
    expect((await setStatus(order.id, 'EN_PREPARACION')).status).toBe(200)
    expect((await setStatus(order.id, 'ENVIADO')).status).toBe(200)
    const delivered = await setStatus(order.id, 'ENTREGADO')
    expect(delivered.body).toMatchObject({ status: 'ENTREGADO', allowedTransitions: [] })
    expect(delivered.body.history).toHaveLength(4)
    expect(await stockOf('p1')).toBe(3)
    expect(await prisma.inventoryMovement.count({ where: { orderId: order.id } })).toBe(2)
  })

  it('rechaza cambios de estado no permitidos', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 1 }])
    for (const status of ['ENVIADO', 'ENTREGADO', 'EN_PREPARACION', 'PENDIENTE_CONFIRMACION']) {
      const res = await setStatus(order.id, status)
      expect(res.status, status).toBe(409)
      expect(res.body.error.code).toBe('INVALID_TRANSITION')
    }
    expect((await setStatus(order.id, 'INVENTADO')).status).toBe(400)

    await setStatus(order.id, 'CANCELADO', 'El cliente desistió')
    // Cancelado es final
    expect((await setStatus(order.id, 'CONFIRMADO')).status).toBe(409)
    expect(await stockOf('p1')).toBe(5)
  })

  it('cancelar exige un motivo y devuelve las unidades solo si se habían descontado', async () => {
    const pending = await createOrder([{ productId: 'p1', quantity: 2 }])
    const noReason = await setStatus(pending.id, 'CANCELADO')
    expect(noReason.status).toBe(400)
    expect(noReason.body.error.details[0].field).toBe('note')

    // Cancelar un pedido pendiente no toca las existencias
    expect((await setStatus(pending.id, 'CANCELADO', 'No respondió')).status).toBe(200)
    expect(await stockOf('p1')).toBe(5)
    expect(await prisma.inventoryMovement.count({ where: { orderId: pending.id } })).toBe(0)

    // Cancelar uno ya confirmado (incluso enviado) devuelve las unidades
    const shipped = await createOrder([{ productId: 'p1', quantity: 2 }])
    await setStatus(shipped.id, 'CONFIRMADO')
    await setStatus(shipped.id, 'ENVIADO')
    expect(await stockOf('p1')).toBe(3)
    const cancelled = await setStatus(shipped.id, 'CANCELADO', 'Devuelto por la transportadora')
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.stockDeductedAt).toBeNull()
    expect(await stockOf('p1')).toBe(5)
    expect(cancelled.body.movements).toMatchObject([
      { type: 'VENTA', quantity: -2, stockAfter: 3 },
      { type: 'DEVOLUCION', quantity: 2, stockAfter: 5 },
    ])
    expect(cancelled.body.movements[1].reason).toContain('Devuelto por la transportadora')
  })

  it('si faltan unidades no confirma y no cambia nada', async () => {
    await prisma.product.update({ where: { id: 'p2' }, data: { stock: 1 } })
    const order = await createOrder([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 3 },
    ])

    const res = await setStatus(order.id, 'CONFIRMADO')
    expect(res.status).toBe(409)
    expect(res.body.error).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      shortages: [{ sku: 'P2', name: 'Oud Rosa', requested: 3, available: 1 }],
    })
    expect(res.body.error.message).toContain('Oud Rosa')

    // La transacción se deshizo completa: p1 tampoco se descontó
    expect(await stockOf('p1')).toBe(5)
    expect(await stockOf('p2')).toBe(1)
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(after).toMatchObject({ status: 'PENDIENTE_CONFIRMACION', stockDeductedAt: null })
    expect(await prisma.inventoryMovement.count()).toBe(0)
    expect(await prisma.orderStatusChange.count()).toBe(0)
  })

  it('dos pedidos confirmados a la vez por la última unidad: solo uno lo consigue', async () => {
    await prisma.product.update({ where: { id: 'p1' }, data: { stock: 1 } })
    const first = await createOrder([{ productId: 'p1', quantity: 1 }])
    const second = await createOrder([{ productId: 'p1', quantity: 1 }], { name: 'Luis Pérez' })

    const results = await Promise.all([
      setStatus(first.id, 'CONFIRMADO'),
      setStatus(second.id, 'CONFIRMADO'),
    ])
    expect(results.map((res) => res.status).sort()).toEqual([200, 409])
    expect(results.find((res) => res.status === 409)!.body.error.code).toBe('INSUFFICIENT_STOCK')

    expect(await stockOf('p1')).toBe(0)
    expect(await prisma.inventoryMovement.count({ where: { type: 'VENTA' } })).toBe(1)
    expect(
      await prisma.order.count({
        where: { status: 'PENDIENTE_CONFIRMACION', id: { in: [first.id, second.id] } },
      }),
    ).toBe(1)
  })

  it('el mismo pedido confirmado dos veces a la vez solo descuenta una vez', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 2 }])

    const results = await Promise.all([
      setStatus(order.id, 'CONFIRMADO'),
      setStatus(order.id, 'CONFIRMADO'),
      setStatus(order.id, 'CONFIRMADO'),
    ])
    expect(results.filter((res) => res.status === 200)).toHaveLength(1)
    for (const res of results.filter((res) => res.status !== 200)) {
      expect(res.status).toBe(409)
      expect(['ORDER_CHANGED', 'INVALID_TRANSITION']).toContain(res.body.error.code)
    }
    expect(await stockOf('p1')).toBe(3)
    expect(await prisma.inventoryMovement.count({ where: { orderId: order.id } })).toBe(1)
    expect(await prisma.orderStatusChange.count({ where: { orderId: order.id } })).toBe(1)
  })

  it('exige el origen del panel para cambiar el estado', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 1 }])
    const res = await agent
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Origin', 'https://otro.example')
      .send({ status: 'CONFIRMADO' })
    expect(res.status).toBe(403)
    expect(await stockOf('p1')).toBe(5)
  })
})

describe('costo de envío', () => {
  beforeEach(resetOrders)

  it('fija el envío, recalcula el total y deja volver a "pendiente de cotización"', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 1 }])
    const shipping = (shippingCost: unknown) =>
      patch(`/api/admin/orders/${order.id}/shipping`).send({ shippingCost })

    const set = await shipping(15000)
    expect(set.status).toBe(200)
    expect(set.body).toMatchObject({ subtotal: 200000, shippingCost: 15000, total: 215000 })

    const free = await shipping(0)
    expect(free.body).toMatchObject({ shippingCost: 0, total: 200000 })

    const pending = await shipping(null)
    expect(pending.body).toMatchObject({ shippingCost: null, total: 200000 })

    for (const invalid of [-1, 1500.5, '15000', 6_000_000]) {
      expect((await shipping(invalid)).status, String(invalid)).toBe(400)
    }
  })

  it('no deja cambiar el envío de un pedido entregado o cancelado', async () => {
    const order = await createOrder([{ productId: 'p1', quantity: 1 }])
    await setStatus(order.id, 'CANCELADO', 'Prueba')
    const res = await patch(`/api/admin/orders/${order.id}/shipping`).send({ shippingCost: 10000 })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ORDER_CLOSED')
  })
})

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { PRIVACY_POLICY_VERSION } from '../src/config/policies.js'
import { prisma } from '../src/lib/prisma.js'
import { formatOrderNumber } from '../src/services/orderService.js'
import { resetCatalog } from './fixtures.js'

const app = createApp()

beforeAll(async () => {
  await resetCatalog()
  // Un producto DEMO y uno agotado, además de los de fixtures.ts (todos con 5 unidades)
  await prisma.product.update({ where: { id: 'p3' }, data: { isDemo: true } })
  await prisma.product.update({ where: { id: 'p4' }, data: { stock: 0 } })
})
afterAll(() => prisma.$disconnect())

const validOrder = () => ({
  customer: {
    name: '  Ana   Gómez ',
    phone: '+57 317-409-6898',
    department: 'Antioquia',
    city: 'Medellín',
    address: 'Calle 10 # 20-30, apto 401',
    notes: '',
  },
  paymentMethod: 'CONTRA_ENTREGA',
  items: [
    { productId: 'p1', quantity: 2 },
    { productId: 'p2', quantity: 1 },
  ],
  dataConsent: true,
})

describe('POST /api/orders', () => {
  it('registra el pedido con precios y totales calculados en el servidor', async () => {
    const body = validOrder() as Record<string, unknown>
    // Un precio enviado por el navegador se ignora: no forma parte del contrato
    body.items = [
      { productId: 'p1', quantity: 2, price: 1 },
      { productId: 'p2', quantity: 1 },
    ]
    const res = await request(app).post('/api/orders').send(body)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      orderNumber: expect.stringMatching(/^ES-\d{4}-\d{6}$/),
      status: 'PENDIENTE_CONFIRMACION',
      paymentMethod: 'CONTRA_ENTREGA',
      customer: { name: 'Ana Gómez', department: 'Antioquia', city: 'Medellín' },
      items: [
        { productId: 'p1', name: 'Ámbar Real', quantity: 2, unitPrice: 200000, lineTotal: 400000 },
        { productId: 'p2', name: 'Oud Rosa', quantity: 1, unitPrice: 300000, lineTotal: 300000 },
      ],
      subtotal: 700000,
      shippingCost: null,
      total: 700000,
    })
    // La respuesta no devuelve teléfono ni dirección
    expect(JSON.stringify(res.body)).not.toContain('3174096898')

    const saved = await prisma.order.findFirstOrThrow({ include: { items: true } })
    expect(saved).toMatchObject({
      customerPhone: '3174096898',
      notes: null,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    })
    expect(saved.dataConsentAt).toBeInstanceOf(Date)
    expect(saved.items.map((item) => item.skuSnapshot).sort()).toEqual(['P1', 'P2'])
  })

  it('no descuenta existencias al registrar (se descuentan al confirmar)', async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: 'p1' } })
    expect(product.stock).toBe(5)
  })

  it('rechaza productos DEMO, agotados, inexistentes o sin existencias suficientes', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder(),
        items: [
          { productId: 'p3', quantity: 1 },
          { productId: 'p4', quantity: 1 },
          { productId: 'p5', quantity: 1 },
          { productId: 'p1', quantity: 6 },
          { productId: 'p2', quantity: 1 },
        ],
      })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ITEMS_UNAVAILABLE')
    expect(res.body.error.items).toEqual([
      { productId: 'p3', reason: 'DEMO_PRODUCT' },
      { productId: 'p4', reason: 'SOLD_OUT' },
      { productId: 'p5', reason: 'NOT_FOUND' },
      { productId: 'p1', reason: 'INSUFFICIENT_STOCK', available: 5 },
    ])
    // Nada se guardó
    expect(await prisma.order.count()).toBe(1)
  })

  it('valida los datos del cliente', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...validOrder(),
        customer: { name: 'A', phone: '12345', department: 'Texas', city: '', address: 'x' },
      })
    expect(res.status).toBe(400)
    const fields = res.body.error.details.map((detail: { field: string }) => detail.field).sort()
    expect(fields).toEqual([
      'customer.address',
      'customer.city',
      'customer.department',
      'customer.name',
      'customer.phone',
    ])
  })

  it('exige la autorización de datos, cantidades válidas y productos sin repetir', async () => {
    const post = (body: object) => request(app).post('/api/orders').send(body)
    expect((await post({ ...validOrder(), dataConsent: false })).status).toBe(400)
    expect((await post({ ...validOrder(), items: [] })).status).toBe(400)
    expect(
      (await post({ ...validOrder(), items: [{ productId: 'p1', quantity: 11 }] })).status,
    ).toBe(400)
    expect(
      (
        await post({
          ...validOrder(),
          items: [
            { productId: 'p1', quantity: 1 },
            { productId: 'p1', quantity: 1 },
          ],
        })
      ).status,
    ).toBe(400)
  })

  it('rechaza el envío si el campo trampa para robots viene lleno', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder(), website: 'http://spam.example' })
    expect(res.status).toBe(400)
  })

  it('responde 400 a un cuerpo que no es JSON válido', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{"customer":')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })
})

describe('formatOrderNumber', () => {
  it('usa el año de Colombia y seis dígitos', () => {
    expect(formatOrderNumber(123, new Date('2026-06-01T12:00:00Z'))).toBe('ES-2026-000123')
    // 1 de enero 03:00 UTC sigue siendo 31 de diciembre en Colombia (UTC-5)
    expect(formatOrderNumber(7, new Date('2027-01-01T03:00:00Z'))).toBe('ES-2026-000007')
  })
})

import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { uploadsRoot } from '../src/storage/imageStorage.js'
import { createTestAdmin, loggedInAgent, PANEL_ORIGIN } from './adminHelpers.js'
import { purgeInventory, resetCatalog } from './fixtures.js'

/* Productos, inventario, fotos, categorías y marcas desde el panel. */

const app = createApp()
let agent: Awaited<ReturnType<typeof loggedInAgent>>

beforeAll(async () => {
  await resetCatalog()
  await createTestAdmin()
  agent = await loggedInAgent(app)
})
afterAll(() => prisma.$disconnect())

// Las peticiones que cambian datos llevan el origen del panel, como haría el navegador
const post = (url: string) => agent.post(url).set('Origin', PANEL_ORIGIN)
const patch = (url: string) => agent.patch(url).set('Origin', PANEL_ORIGIN)
const put = (url: string) => agent.put(url).set('Origin', PANEL_ORIGIN)
const del = (url: string) => agent.delete(url).set('Origin', PANEL_ORIGIN)

const newProduct = (overrides: object = {}) => ({
  sku: 'AR-0101',
  slug: 'oud-de-prueba',
  name: 'Oud de Prueba',
  brandId: 'marca-a',
  categoryId: 'c-arabes',
  shortDescription: 'Oud con rosa',
  description: 'Una descripción completa.',
  price: 280000,
  sizeMl: 100,
  concentration: 'EDP',
  notesTop: ['Azafrán'],
  initialStock: 4,
  ...overrides,
})

describe('productos', () => {
  beforeEach(async () => {
    await purgeInventory()
    await prisma.product.deleteMany({ where: { sku: { startsWith: 'AR-01' } } })
  })

  it('crea un borrador y registra el inventario inicial como entrada', async () => {
    const res = await post('/api/admin/products').send(newProduct())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      sku: 'AR-0101',
      status: 'BORRADOR',
      price: 280000,
      stock: 4,
      brand: { name: 'Marca A' },
      category: { slug: 'perfumes-arabes' },
      movementCount: 1,
    })
    const movement = await prisma.inventoryMovement.findFirstOrThrow({
      where: { productId: res.body.id },
    })
    expect(movement).toMatchObject({ type: 'ENTRADA', quantity: 4, stockAfter: 4 })
    expect(movement.adminId).not.toBeNull()

    // Un borrador no aparece en la tienda
    expect((await request(app).get('/api/products/oud-de-prueba')).status).toBe(404)
    // La búsqueda de la tienda lo encontrará cuando se publique: el texto se calcula al guardar
    const saved = await prisma.product.findUniqueOrThrow({ where: { id: res.body.id } })
    expect(saved.searchText).toBe('oud de prueba marca a azafran')
  })

  it.each([
    [{ price: -1 }, 'price'],
    [{ price: 1.5 }, 'price'],
    [{ sku: 'XX-1' }, 'sku'],
    [{ slug: 'Con Espacios' }, 'slug'],
    [{ name: '' }, 'name'],
    [{ compareAtPrice: 100 }, 'compareAtPrice'],
    [{ initialStock: -2 }, 'initialStock'],
    [{ stock: 50 }, ''],
  ])('rechaza datos inválidos: %o', async (override, field) => {
    const res = await post('/api/admin/products').send(newProduct(override))
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.map((detail: { field: string }) => detail.field)).toContain(field)
    expect(await prisma.product.count({ where: { sku: 'AR-0101' } })).toBe(0)
  })

  it('rechaza un SKU o una dirección repetidos con un mensaje claro', async () => {
    await post('/api/admin/products').send(newProduct())
    const sameSku = await post('/api/admin/products').send(newProduct({ slug: 'otra' }))
    expect(sameSku.status).toBe(409)
    expect(sameSku.body.error).toMatchObject({ code: 'DUPLICATE_SKU' })
    const sameSlug = await post('/api/admin/products').send(newProduct({ sku: 'AR-0102' }))
    expect(sameSlug.status).toBe(409)
    expect(sameSlug.body.error).toMatchObject({ code: 'DUPLICATE_SLUG' })
  })

  it('rechaza una marca o categoría que no existe', async () => {
    const res = await post('/api/admin/products').send(newProduct({ brandId: 'no-existe' }))
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_BRAND')
  })

  it('no deja publicar un producto incompleto', async () => {
    const created = await post('/api/admin/products').send(
      newProduct({ description: '', shortDescription: '' }),
    )
    const res = await patch(`/api/admin/products/${created.body.id}/status`).send({
      status: 'PUBLICADO',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INCOMPLETE_PRODUCT')
    expect(res.body.error.message).toMatch(/descripción/)
  })

  it('publicar lo muestra en la tienda; archivar lo oculta', async () => {
    const created = await post('/api/admin/products').send(newProduct())
    const published = await patch(`/api/admin/products/${created.body.id}/status`).send({
      status: 'PUBLICADO',
    })
    expect(published.status).toBe(200)
    expect(published.body.publishedAt).not.toBeNull()
    expect((await request(app).get('/api/products/oud-de-prueba')).status).toBe(200)

    await patch(`/api/admin/products/${created.body.id}/status`).send({ status: 'ARCHIVADO' })
    expect((await request(app).get('/api/products/oud-de-prueba')).status).toBe(404)
  })

  it('edita solo los campos enviados; las existencias no se editan directamente', async () => {
    const created = await post('/api/admin/products').send(newProduct())
    const res = await patch(`/api/admin/products/${created.body.id}`).send({
      price: 300000,
      compareAtPrice: 350000,
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ price: 300000, compareAtPrice: 350000, sizeMl: 100 })

    const stock = await patch(`/api/admin/products/${created.body.id}`).send({ stock: 99 })
    expect(stock.status).toBe(400)

    // Precio anterior menor que el nuevo precio: descuento falso
    const fake = await patch(`/api/admin/products/${created.body.id}`).send({ price: 400000 })
    expect(fake.status).toBe(400)
    expect(fake.body.error.code).toBe('INVALID_COMPARE_AT_PRICE')
  })

  it('un producto con historial no se borra: se propone archivarlo', async () => {
    const withStock = await post('/api/admin/products').send(newProduct())
    const res = await del(`/api/admin/products/${withStock.body.id}`)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('PRODUCT_HAS_HISTORY')

    const empty = await post('/api/admin/products').send(
      newProduct({ sku: 'AR-0102', slug: 'sin-stock', initialStock: 0 }),
    )
    expect((await del(`/api/admin/products/${empty.body.id}`)).status).toBe(204)
    expect(await prisma.product.count({ where: { id: empty.body.id } })).toBe(0)
  })

  it('lista con búsqueda, filtro de estado y stock bajo', async () => {
    await post('/api/admin/products').send(newProduct({ initialStock: 1 }))
    const search = await agent.get('/api/admin/products?q=ambar')
    expect(search.body.items.map((item: { name: string }) => item.name).sort()).toEqual([
      'Ámbar Nocturno',
      'Ámbar Real',
    ])
    const drafts = await agent.get('/api/admin/products?estado=BORRADOR')
    expect(drafts.body.items.map((item: { sku: string }) => item.sku).sort()).toEqual([
      'AR-0101',
      'P5',
    ])
    const low = await agent.get('/api/admin/products?stock=bajo')
    expect(low.body.items.map((item: { sku: string }) => item.sku)).toEqual(['AR-0101'])
    expect(low.body.items[0].isLowStock).toBe(true)
  })
})

describe('inventario', () => {
  const stockOf = async (id: string) =>
    (await prisma.product.findUniqueOrThrow({ where: { id } })).stock

  it('una entrada suma unidades y queda en el historial con quién la hizo', async () => {
    const before = await stockOf('p2')
    const res = await post('/api/admin/inventory/movements').send({
      productId: 'p2',
      type: 'ENTRADA',
      quantity: 6,
      reason: 'Llegada de proveedor',
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      type: 'ENTRADA',
      quantity: 6,
      stockAfter: before + 6,
      adminName: 'Admin Prueba',
    })
    expect(await stockOf('p2')).toBe(before + 6)

    const history = await agent.get('/api/admin/inventory/movements?producto=p2')
    expect(history.body.items[0]).toMatchObject({ reason: 'Llegada de proveedor' })
  })

  it('un ajuste no puede dejar las existencias por debajo de cero', async () => {
    const before = await stockOf('p1')
    const res = await post('/api/admin/inventory/movements').send({
      productId: 'p1',
      type: 'AJUSTE',
      quantity: -(before + 1),
      reason: 'Conteo físico',
    })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK')
    expect(await stockOf('p1')).toBe(before)
  })

  it('rechaza una entrada negativa, cantidad 0 y tipos que solo usa el sistema', async () => {
    for (const body of [
      { type: 'ENTRADA', quantity: -1 },
      { type: 'AJUSTE', quantity: 0 },
      { type: 'VENTA', quantity: -1 },
    ]) {
      const res = await post('/api/admin/inventory/movements').send({
        productId: 'p1',
        reason: 'Prueba',
        ...body,
      })
      expect(res.status).toBe(400)
    }
  })

  it('con dos ajustes simultáneos por la última unidad, solo uno se aplica', async () => {
    await prisma.$executeRaw`UPDATE "Product" SET "stock" = 1 WHERE "id" = 'p3'`
    const adjust = () =>
      post('/api/admin/inventory/movements').send({
        productId: 'p3',
        type: 'AJUSTE',
        quantity: -1,
        reason: 'Unidad dañada',
      })
    const results = await Promise.all([adjust(), adjust(), adjust()])
    expect(results.map((res) => res.status).sort()).toEqual([201, 409, 409])
    expect(await stockOf('p3')).toBe(0)
  })

  it('la base de datos no deja editar ni borrar el historial', async () => {
    const movement = await prisma.inventoryMovement.findFirstOrThrow()
    // Mensaje que devuelve PostgreSQL (regla de la migración panel_admin)
    const rejectedWith = (pattern: RegExp) => ({
      meta: { driverAdapterError: { cause: { originalMessage: expect.stringMatching(pattern) } } },
    })
    await expect(
      prisma.inventoryMovement.update({ where: { id: movement.id }, data: { quantity: 99 } }),
    ).rejects.toMatchObject(rejectedWith(/no se puede modificar/))
    await expect(
      prisma.inventoryMovement.delete({ where: { id: movement.id } }),
    ).rejects.toMatchObject(rejectedWith(/no se puede modificar/))
    await expect(prisma.$executeRaw`TRUNCATE "InventoryMovement"`).rejects.toMatchObject(
      rejectedWith(/no se puede vaciar/),
    )
    // Tampoco admite cantidades incoherentes, aunque las escriba otro programa
    await expect(
      prisma.inventoryMovement.create({
        data: { productId: 'p1', type: 'ENTRADA', quantity: -3, stockAfter: 0, reason: 'x' },
      }),
    ).rejects.toThrow()
    expect(await prisma.inventoryMovement.count({ where: { id: movement.id } })).toBe(1)
  })
})

describe('fotos', () => {
  const photo = (width = 1200, height = 1500) =>
    sharp({ create: { width, height, channels: 3, background: '#c9a54e' } })
      .png()
      .toBuffer()

  it('convierte la foto a WebP en varias medidas y la muestra en la tienda', async () => {
    const res = await post('/api/admin/products/p1/images').attach(
      'imagen',
      await photo(),
      'foto.png',
    )
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      url: expect.stringMatching(/^\/uploads\/products\/p1\/[0-9a-f]{16}\/1200\.webp$/),
      widths: [480, 960, 1200],
      alt: 'Ámbar Real de Marca A, 100 ml',
      position: 0,
    })
    const file = path.join(uploadsRoot, res.body.url.replace('/uploads/', ''))
    expect(existsSync(file)).toBe(true)
    expect((await sharp(file).metadata()).format).toBe('webp')

    // Se sirve con caché larga y se puede mostrar desde la tienda en otro dominio
    const served = await request(app).get(res.body.url)
    expect(served.status).toBe(200)
    expect(served.headers['content-type']).toBe('image/webp')
    expect(served.headers['cross-origin-resource-policy']).toBe('cross-origin')
    expect(served.headers['cache-control']).toContain('immutable')

    const product = await request(app).get('/api/products/p1')
    expect(product.body.images[0].url).toBe(res.body.url)
  })

  it('rechaza archivos que no son imágenes aunque se llamen .png, y fotos muy pequeñas', async () => {
    const fake = await post('/api/admin/products/p1/images').attach(
      'imagen',
      Buffer.from('<script>alert(1)</script>'),
      { filename: 'foto.png', contentType: 'image/png' },
    )
    expect(fake.status).toBe(400)
    expect(fake.body.error.code).toBe('INVALID_IMAGE')

    const gif = await post('/api/admin/products/p1/images').attach(
      'imagen',
      await sharp({ create: { width: 400, height: 400, channels: 3, background: '#000' } })
        .gif()
        .toBuffer(),
      'foto.gif',
    )
    expect(gif.status).toBe(400)

    const tiny = await post('/api/admin/products/p1/images').attach(
      'imagen',
      await photo(100, 100),
      'p.png',
    )
    expect(tiny.status).toBe(400)
    expect(tiny.body.error.code).toBe('IMAGE_TOO_SMALL')

    // Pocos bytes pero demasiados píxeles (25 MP): se rechaza antes de decodificarla
    const huge = await post('/api/admin/products/p1/images').attach(
      'imagen',
      await sharp({ create: { width: 5000, height: 5000, channels: 3, background: '#000' } })
        .png({ compressionLevel: 9 })
        .toBuffer(),
      'enorme.png',
    )
    expect(huge.status).toBe(400)
    expect(huge.body.error.code).toBe('IMAGE_TOO_LARGE')
  })

  it('rechaza archivos de más de 8 MB', async () => {
    const res = await post('/api/admin/products/p1/images').attach(
      'imagen',
      Buffer.alloc(8 * 1024 * 1024 + 1),
      'grande.jpg',
    )
    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('FILE_TOO_LARGE')
  })

  it('cambia la principal, edita el texto alternativo y borra fotos con sus archivos', async () => {
    const second = await post('/api/admin/products/p1/images')
      .field('alt', 'Frasco de Ámbar Real visto de lado')
      .attach('imagen', await photo(800, 1000), 'lado.png')
    expect(second.body).toMatchObject({ position: 1, widths: [480, 800] })

    const all = (await agent.get('/api/admin/products/p1')).body.images as { id: string }[]
    const reordered = await put('/api/admin/products/p1/images/order').send({
      imageIds: [
        second.body.id,
        ...all.filter((image) => image.id !== second.body.id).map((image) => image.id),
      ],
    })
    expect(reordered.body.items[0]).toMatchObject({ id: second.body.id, position: 0 })

    const incomplete = await put('/api/admin/products/p1/images/order').send({
      imageIds: [second.body.id],
    })
    expect(incomplete.status).toBe(400)

    const alt = await patch(`/api/admin/products/p1/images/${second.body.id}`).send({
      alt: 'Ámbar Real, vista lateral',
    })
    expect(alt.body.alt).toBe('Ámbar Real, vista lateral')

    const folder = path.join(uploadsRoot, 'products/p1', second.body.url.split('/')[4])
    expect(existsSync(folder)).toBe(true)
    expect((await del(`/api/admin/products/p1/images/${second.body.id}`)).status).toBe(204)
    expect(existsSync(folder)).toBe(false)
    const remaining = (await agent.get('/api/admin/products/p1')).body.images
    expect(remaining.map((image: { position: number }) => image.position)).toEqual([0])
  })
})

describe('categorías y marcas', () => {
  it('crea, renombra y borra una categoría vacía', async () => {
    const created = await post('/api/admin/categories').send({
      name: 'Ediciones limitadas',
      slug: 'ediciones-limitadas',
      position: 5,
    })
    expect(created.status).toBe(201)
    const renamed = await patch(`/api/admin/categories/${created.body.id}`).send({
      name: 'Edición limitada',
    })
    expect(renamed.body.name).toBe('Edición limitada')
    expect((await del(`/api/admin/categories/${created.body.id}`)).status).toBe(204)
  })

  it('no borra categorías ni marcas con productos', async () => {
    const category = await del('/api/admin/categories/c-nicho')
    expect(category.status).toBe(409)
    expect(category.body.error.code).toBe('CATEGORY_IN_USE')
    const brand = await del('/api/admin/brands/marca-b')
    expect(brand.status).toBe(409)
    expect(brand.body.error.code).toBe('BRAND_IN_USE')
  })

  it('al renombrar una marca, la búsqueda de la tienda usa el nombre nuevo', async () => {
    await patch('/api/admin/brands/marca-b').send({ name: 'Maison Prueba' })
    const res = await request(app).get('/api/products?q=maison')
    expect(res.body.items.length).toBeGreaterThan(0)
    expect(
      res.body.items.every((item: { brand: { slug: string } }) => item.brand.slug === 'marca-b'),
    ).toBe(true)
  })

  it('rechaza direcciones repetidas', async () => {
    const res = await post('/api/admin/brands').send({ name: 'Otra A', slug: 'marca-a' })
    expect(res.status).toBe(409)
  })
})

describe('resumen', () => {
  it('cuenta lo que hay en la base de datos', async () => {
    const res = await agent.get('/api/admin/dashboard')
    expect(res.status).toBe(200)
    const published = await prisma.product.count({ where: { status: 'PUBLICADO' } })
    expect(res.body.products.byStatus.PUBLICADO).toBe(published)
    expect(res.body.orders.pendingCount).toBe(
      await prisma.order.count({ where: { status: 'PENDIENTE_CONFIRMACION' } }),
    )
    expect(res.body.orders.confirmedLast30Days).toEqual({ count: 0, total: 0 })
    expect(res.body.recentMovements.length).toBeGreaterThan(0)
  })
})

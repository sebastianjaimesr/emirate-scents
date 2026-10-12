import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { resetCatalog } from './fixtures.js'

const app = createApp()
const slugs = (body: { items: { slug: string }[] }) => body.items.map((item) => item.slug)

beforeAll(resetCatalog)
afterAll(() => prisma.$disconnect())

describe('GET /api/health', () => {
  it('confirma que el servicio y la base de datos responden', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', database: 'ok' })
  })
})

describe('GET /api/products', () => {
  it('lista solo productos publicados, destacados primero', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(4)
    expect(slugs(res.body)).toEqual(['p2', 'p4', 'p1', 'p3'])
    expect(slugs(res.body)).not.toContain('p5')
  })

  it('devuelve precios como números enteros en COP', async () => {
    const res = await request(app).get('/api/products?q=cuero')
    expect(res.body.items[0]).toMatchObject({
      price: 700000,
      brand: { slug: 'marca-b', name: 'Marca B' },
      categorySlug: 'nicho',
      isDemo: false,
    })
  })

  it('busca sin importar tildes ni mayúsculas, y exige todas las palabras', async () => {
    expect(slugs((await request(app).get('/api/products?q=AMBAR')).body)).toEqual(['p4', 'p1'])
    expect(slugs((await request(app).get('/api/products?q=oud%20rosa')).body)).toEqual(['p2'])
    expect((await request(app).get('/api/products?q=oud%20cuero')).body.total).toBe(0)
  })

  it('no interpreta % ni _ como comodines', async () => {
    expect((await request(app).get('/api/products?q=%25')).body.total).toBe(4)
    expect((await request(app).get('/api/products?q=zz%25')).body.total).toBe(0)
  })

  it('filtra por categoría, marca, tamaño, familia y precio', async () => {
    const get = async (query: string) =>
      slugs((await request(app).get(`/api/products?${query}`)).body)
    expect(await get('categoria=nicho')).toEqual(['p3'])
    expect(await get('marca=marca-b&orden=nombre')).toEqual(['p4', 'p3'])
    expect(await get('tamano=50')).toEqual(['p2'])
    expect(await get('familia=Oriental&orden=precio-asc')).toEqual(['p1', 'p4'])
    expect(await get('precioMin=250000&precioMax=300000&orden=precio-desc')).toEqual(['p2', 'p4'])
  })

  it('pagina y corrige una página fuera de rango', async () => {
    const res = await request(app).get('/api/products?orden=precio-asc&porPagina=3&pagina=9')
    expect(res.body).toMatchObject({ total: 4, page: 2, totalPages: 2 })
    expect(slugs(res.body)).toEqual(['p3'])
  })

  it('rechaza parámetros inválidos con 400 y el detalle', async () => {
    const res = await request(app).get('/api/products?orden=barato&porPagina=500&precioMin=-1')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.map((detail: { field: string }) => detail.field).sort()).toEqual([
      'orden',
      'porPagina',
      'precioMin',
    ])
  })

  it('rechaza un rango de precios invertido', async () => {
    const res = await request(app).get('/api/products?precioMin=500&precioMax=100')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/products/:slug', () => {
  it('devuelve el detalle de un producto publicado', async () => {
    const res = await request(app).get('/api/products/p2')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      slug: 'p2',
      isFeatured: true,
      notes: { top: [], heart: ['Rosa'], base: [] },
    })
  })

  it('responde 404 a productos inexistentes o no publicados', async () => {
    expect((await request(app).get('/api/products/no-existe')).status).toBe(404)
    expect((await request(app).get('/api/products/p5')).status).toBe(404)
  })

  it('sugiere relacionados de la misma categoría, primero la misma familia', async () => {
    const res = await request(app).get('/api/products/p1/related')
    expect(slugs(res.body)).toEqual(['p4', 'p2'])
  })
})

describe('catálogo auxiliar', () => {
  it('calcula las opciones de filtro por categoría', async () => {
    const res = await request(app).get('/api/catalog/filters?categoria=perfumes-arabes')
    expect(res.body).toEqual({
      brands: [
        { slug: 'marca-a', name: 'Marca A', count: 2 },
        { slug: 'marca-b', name: 'Marca B', count: 1 },
      ],
      sizes: [
        { value: 50, count: 1 },
        { value: 100, count: 2 },
      ],
      families: [
        { value: 'Amaderada', count: 1 },
        { value: 'Oriental', count: 2 },
      ],
      priceRange: { min: 200000, max: 300000 },
    })
  })

  it('devuelve las selecciones de inicio', async () => {
    expect(slugs((await request(app).get('/api/catalog/highlights/novedades')).body)).toEqual([
      'p3',
    ])
    expect((await request(app).get('/api/catalog/highlights/otra')).status).toBe(400)
  })

  it('busca varios productos por id en el orden pedido e ignora los que no existen', async () => {
    const res = await request(app).get('/api/catalog/lookup?ids=p3,nada,p5,p1')
    expect(slugs(res.body)).toEqual(['p3', 'p1'])
  })

  it('lista categorías con su número de productos publicados', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.body.items).toEqual([
      { slug: 'perfumes-arabes', name: 'Perfumes árabes', productCount: 3 },
      { slug: 'nicho', name: 'Perfumería de nicho', productCount: 1 },
    ])
  })
})

describe('seguridad y errores', () => {
  it('incluye cabeceras de seguridad y oculta la tecnología del servidor', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('solo permite CORS desde la tienda', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173')
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const other = await request(app).get('/api/health').set('Origin', 'https://otro-sitio.com')
    expect(other.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('responde JSON 404 a rutas desconocidas', async () => {
    const res = await request(app).get('/api/no-existe')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

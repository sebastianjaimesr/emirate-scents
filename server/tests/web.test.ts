import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import express from 'express'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import { seo } from '../src/web/seo.js'
import { storefront } from '../src/web/storefront.js'
import { resetCatalog } from './fixtures.js'

describe('tienda servida por la API (storefront)', () => {
  const dist = mkdtempSync(path.join(tmpdir(), 'tienda-'))
  mkdirSync(path.join(dist, 'assets'))
  writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>Tienda</title>')
  writeFileSync(path.join(dist, 'assets', 'index-abc123.js'), 'console.log(1)')
  writeFileSync(path.join(dist, 'favicon.png'), 'png')

  const app = express()
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use(storefront(dist))
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND' } })
  })

  afterAll(() => rmSync(dist, { recursive: true, force: true }))

  it('devuelve index.html en cualquier página de la tienda, sin caché', async () => {
    for (const url of ['/', '/catalogo/nicho', '/producto/oud?x=1']) {
      const res = await request(app).get(url)
      expect(res.status).toBe(200)
      expect(res.text).toContain('<title>Tienda</title>')
      expect(res.headers['cache-control']).toBe('no-cache')
    }
  })

  it('guarda un año los archivos con huella en el nombre', async () => {
    const res = await request(app).get('/assets/index-abc123.js')
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable')
    const icon = await request(app).get('/favicon.png')
    expect(icon.headers['cache-control']).toBe('public, max-age=3600')
  })

  it('no tapa las rutas de la API ni los archivos que no existen', async () => {
    for (const url of ['/api/no-existe', '/assets/index-viejo.js', '/uploads/products/x/y.webp']) {
      const res = await request(app).get(url)
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    }
  })

  it('con la tienda en GitHub Pages: sirve el panel y redirige las páginas de la tienda', async () => {
    const adminOnly = express().use(
      storefront(dist, { storeUrl: 'https://sebastianjaimesr.github.io/emirate-scents' }),
    )
    for (const url of ['/admin', '/admin/pedidos/abc']) {
      const res = await request(adminOnly).get(url)
      expect(res.status).toBe(200)
      expect(res.text).toContain('<title>Tienda</title>')
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow')
    }
    const page = await request(adminOnly).get('/producto/oud?x=1')
    expect(page.status).toBe(302)
    expect(page.headers.location).toBe(
      'https://sebastianjaimesr.github.io/emirate-scents/producto/oud?x=1',
    )
    // Los archivos del panel siguen sirviéndose
    expect((await request(adminOnly).get('/assets/index-abc123.js')).status).toBe(200)
  })

  it('explica qué hacer si falta la tienda compilada', () => {
    expect(() => storefront(path.join(dist, 'no-existe'))).toThrow(/npm run build/)
  })
})

describe('robots.txt y sitemap.xml', () => {
  const app = express().use(seo('https://tienda.example'))

  beforeAll(async () => {
    await resetCatalog()
    await prisma.product.update({ where: { id: 'p4' }, data: { isDemo: true } })
  })
  afterAll(() => prisma.$disconnect())

  it('robots.txt excluye páginas personales y apunta al mapa del sitio', async () => {
    const res = await request(app).get('/robots.txt')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Disallow: /pedido')
    expect(res.text).toContain('Sitemap: https://tienda.example/sitemap.xml')
  })

  it('en el servidor solo de API y panel, robots.txt no deja indexar nada', async () => {
    const adminOnly = express().use(seo('https://tienda.example', { adminOnly: true }))
    const res = await request(adminOnly).get('/robots.txt')
    expect(res.text).toBe('User-agent: *\nDisallow: /\n')
  })

  it('el mapa del sitio lista categorías y productos publicados, sin DEMO ni borradores', async () => {
    const res = await request(app).get('/sitemap.xml')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/xml/)
    expect(res.text).toContain('<loc>https://tienda.example/</loc>')
    expect(res.text).toContain('<loc>https://tienda.example/catalogo/nicho</loc>')
    for (const slug of ['p1', 'p2', 'p3']) {
      expect(res.text).toContain(`<loc>https://tienda.example/producto/${slug}</loc>`)
    }
    expect(res.text).not.toContain('/producto/p4') // DEMO
    expect(res.text).not.toContain('/producto/p5') // borrador
  })
})

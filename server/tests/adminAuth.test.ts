import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { passwordProblem } from '../src/admin/adminAccounts.js'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { ADMIN_PASSWORD, createTestAdmin, loggedInAgent, PANEL_ORIGIN } from './adminHelpers.js'
import { resetCatalog } from './fixtures.js'

/* Acceso al panel: sesión, cookie, límites de intentos y protección de cada ruta. */

let app = createApp()

beforeEach(async () => {
  await resetCatalog()
  await createTestAdmin()
  // App nueva en cada prueba: contadores de intentos desde cero
  app = createApp()
})
afterAll(() => prisma.$disconnect())

const login = (body: object, origin = PANEL_ORIGIN) =>
  request(app).post('/api/admin/auth/login').set('Origin', origin).send(body)

describe('un visitante sin sesión', () => {
  const routes: [string, string][] = [
    ['get', '/api/admin/auth/me'],
    ['get', '/api/admin/dashboard'],
    ['get', '/api/admin/products'],
    ['post', '/api/admin/products'],
    ['get', '/api/admin/products/p1'],
    ['patch', '/api/admin/products/p1'],
    ['patch', '/api/admin/products/p1/status'],
    ['delete', '/api/admin/products/p1'],
    ['post', '/api/admin/products/p1/images'],
    ['put', '/api/admin/products/p1/images/order'],
    ['patch', '/api/admin/products/p1/images/x'],
    ['delete', '/api/admin/products/p1/images/x'],
    ['get', '/api/admin/inventory/movements'],
    ['post', '/api/admin/inventory/movements'],
    ['get', '/api/admin/orders'],
    ['get', '/api/admin/orders/x'],
    ['patch', '/api/admin/orders/x/status'],
    ['patch', '/api/admin/orders/x/shipping'],
    ['get', '/api/admin/categories'],
    ['post', '/api/admin/categories'],
    ['patch', '/api/admin/categories/c-nicho'],
    ['delete', '/api/admin/categories/c-nicho'],
    ['get', '/api/admin/brands'],
    ['post', '/api/admin/brands'],
    ['patch', '/api/admin/brands/marca-a'],
    ['delete', '/api/admin/brands/marca-a'],
    ['get', '/api/admin/ruta-que-no-existe'],
  ]

  it.each(routes)('recibe 401 en %s %s', async (method, url) => {
    const agent = request(app) as unknown as Record<string, (url: string) => request.Test>
    const res = await agent[method]!(url).set('Origin', PANEL_ORIGIN).send({})
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('con una cookie inventada también recibe 401', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Cookie', `es_admin=${'a'.repeat(43)}`)
    expect(res.status).toBe(401)
  })

  it('no cambia nada en la base de datos', async () => {
    await request(app)
      .patch('/api/admin/products/p1')
      .set('Origin', PANEL_ORIGIN)
      .send({ price: 1 })
    const product = await prisma.product.findUniqueOrThrow({ where: { id: 'p1' } })
    expect(product.price.toNumber()).toBe(200000)
  })
})

describe('inicio de sesión', () => {
  it('con datos correctos entrega una cookie HttpOnly y SameSite=Strict', async () => {
    const res = await login({ email: '  ADMIN@prueba.test ', password: ADMIN_PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.admin).toEqual({
      id: expect.any(String),
      email: 'admin@prueba.test',
      name: 'Admin Prueba',
    })
    // Nunca se devuelve la huella de la contraseña
    expect(JSON.stringify(res.body)).not.toContain('argon2')
    const cookie = res.headers['set-cookie']![0]!
    expect(cookie).toMatch(/^es_admin=[\w-]{43};/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/')
    // En la base de datos se guarda la huella del código, no el código
    const token = cookie.split(';')[0]!.split('=')[1]!
    const session = await prisma.adminSession.findFirstOrThrow()
    expect(session.tokenHash).not.toBe(token)
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('con contraseña incorrecta, correo inexistente o cuenta inactiva: el mismo mensaje', async () => {
    await createTestAdmin('inactivo@prueba.test', false)
    const attempts = [
      { email: 'admin@prueba.test', password: 'otra contraseña cualquiera' },
      { email: 'nadie@prueba.test', password: ADMIN_PASSWORD },
      { email: 'inactivo@prueba.test', password: ADMIN_PASSWORD },
      { email: 'no-es-correo', password: 'x' },
      {},
    ]
    for (const body of attempts) {
      const res = await login(body)
      expect(res.status).toBe(401)
      expect(res.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      })
      expect(res.headers['set-cookie']).toBeUndefined()
    }
  })

  it('bloquea tras 5 intentos fallidos desde la misma dirección IP (15 minutos)', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await login({ email: 'admin@prueba.test', password: 'mal' })).status).toBe(401)
    }
    const blocked = await login({ email: 'admin@prueba.test', password: ADMIN_PASSWORD })
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')
  })

  it('los inicios de sesión correctos no cuentan como intentos', async () => {
    for (let attempt = 0; attempt < 7; attempt++) {
      expect((await login({ email: 'admin@prueba.test', password: ADMIN_PASSWORD })).status).toBe(
        200,
      )
    }
  })

  it('rechaza peticiones desde otro sitio o sin origen (anti-CSRF)', async () => {
    const foreign = await login(
      { email: 'admin@prueba.test', password: ADMIN_PASSWORD },
      'https://otro.example',
    )
    expect(foreign.status).toBe(403)
    const noOrigin = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@prueba.test', password: ADMIN_PASSWORD })
    expect(noOrigin.status).toBe(403)
  })

  it('una sesión válida tampoco puede cambiar datos desde otro sitio', async () => {
    const agent = await loggedInAgent(app)
    const res = await agent
      .patch('/api/admin/products/p1')
      .set('Origin', 'https://otro.example')
      .send({ price: 1 })
    expect(res.status).toBe(403)
    // Leer sí se puede (no cambia nada), pero el navegador no deja leer la respuesta: sin CORS
    const read = await agent.get('/api/admin/products').set('Origin', 'https://otro.example')
    expect(read.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('sesión', () => {
  it('/auth/me devuelve el administrador y cerrar sesión la invalida', async () => {
    const agent = await loggedInAgent(app)
    expect((await agent.get('/api/admin/auth/me')).body.admin.email).toBe('admin@prueba.test')

    const out = await agent.post('/api/admin/auth/logout').set('Origin', PANEL_ORIGIN)
    expect(out.status).toBe(204)
    expect(out.headers['set-cookie']![0]).toMatch(/es_admin=;/)
    expect(await prisma.adminSession.count()).toBe(0)
    expect((await agent.get('/api/admin/auth/me')).status).toBe(401)
  })

  it('caduca tras 2 horas sin actividad', async () => {
    const agent = await loggedInAgent(app)
    await prisma.adminSession.updateMany({
      data: { lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000 - 1000) },
    })
    expect((await agent.get('/api/admin/auth/me')).status).toBe(401)
    expect(await prisma.adminSession.count()).toBe(0)
  })

  it('caduca a las 12 horas aunque haya actividad', async () => {
    const agent = await loggedInAgent(app)
    await prisma.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await agent.get('/api/admin/auth/me')).status).toBe(401)
  })

  it('se cierra si la cuenta se desactiva', async () => {
    const agent = await loggedInAgent(app)
    await prisma.adminUser.updateMany({ data: { isActive: false } })
    expect((await agent.get('/api/admin/auth/me')).status).toBe(401)
  })

  it('las respuestas del panel no se guardan en caché ni se indexan', async () => {
    const agent = await loggedInAgent(app)
    const res = await agent.get('/api/admin/dashboard')
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow')
  })
})

describe('política de contraseñas (npm run admin:crear)', () => {
  it('exige 12 caracteres y rechaza las fáciles de adivinar', () => {
    expect(passwordProblem('corta', 'ana@x.co')).toMatch(/12 caracteres/)
    expect(passwordProblem('aaaaaaaaaaaaaa', 'ana@x.co')).toMatch(/fácil/)
    expect(passwordProblem('anagomez-2026-perfumes', 'anagomez@x.co')).toMatch(/fácil/)
    expect(passwordProblem('frase de varias palabras', 'ana@x.co')).toBeNull()
  })
})

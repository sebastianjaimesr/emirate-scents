import type { Express } from 'express'
import request from 'supertest'
import { hashPassword } from '../src/lib/password.js'
import { prisma } from '../src/lib/prisma.js'

/** Origen del panel en las pruebas (ADMIN_ORIGIN en vitest.config.ts). */
export const PANEL_ORIGIN = 'http://panel.test'
export const ADMIN_PASSWORD = 'una frase larga de prueba'

export async function createTestAdmin(email = 'admin@prueba.test', isActive = true) {
  return prisma.adminUser.create({
    data: {
      email,
      name: 'Admin Prueba',
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      isActive,
    },
  })
}

/** Navegador simulado con sesión iniciada: guarda la cookie y envía el Origin del panel. */
export async function loggedInAgent(app: Express, email = 'admin@prueba.test') {
  const agent = request.agent(app)
  const res = await agent
    .post('/api/admin/auth/login')
    .set('Origin', PANEL_ORIGIN)
    .send({ email, password: ADMIN_PASSWORD })
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión: ${res.status}`)
  return agent
}

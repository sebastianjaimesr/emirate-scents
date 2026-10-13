import type { Request, Response } from 'express'
import { currentAdmin } from '../admin/guards.js'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  purgeExpiredSessions,
  readSessionToken,
  setSessionCookie,
} from '../admin/session.js'
import { HttpError } from '../lib/httpError.js'
import { logger } from '../lib/logger.js'
import { getDummyHash, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { loginSchema } from '../validators/admin.js'

/** Mismo mensaje pase lo que pase: no revela si el correo existe o si la cuenta está inactiva. */
const invalidCredentials = () =>
  new HttpError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) throw invalidCredentials()
  const { email, password } = parsed.data

  const admin = await prisma.adminUser.findUnique({ where: { email } })
  // Se comprueba siempre una contraseña (la real o una ficticia): el tiempo de respuesta
  // no delata qué correos tienen cuenta
  const valid = await verifyPassword(admin?.passwordHash ?? (await getDummyHash()), password)
  if (!admin || !valid || !admin.isActive) {
    logger.warn('Intento de acceso al panel fallido')
    throw invalidCredentials()
  }

  // Si ya había una sesión en este navegador, se cierra antes de abrir la nueva
  const previous = readSessionToken(req)
  if (previous) await deleteSession(previous)
  await purgeExpiredSessions()

  const token = await createSession(admin.id)
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
  setSessionCookie(res, token)
  logger.info({ adminId: admin.id }, 'Inicio de sesión en el panel')
  res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } })
}

export async function logout(req: Request, res: Response) {
  const token = readSessionToken(req)
  if (token) await deleteSession(token)
  clearSessionCookie(res)
  res.status(204).end()
}

export function me(_req: Request, res: Response) {
  res.json({ admin: currentAdmin(res) })
}

import { createHash, randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

/*
  Sesiones del panel. Al iniciar sesión se crea un código aleatorio de 256 bits que viaja en
  una cookie HttpOnly (el JavaScript de la página no puede leerla), Secure en producción (solo
  HTTPS) y SameSite=Strict (el navegador no la envía en peticiones que empiezan en otro sitio).
  En la base de datos solo se guarda la huella SHA-256 del código.
*/

/** Tras 2 horas sin actividad, la sesión caduca. */
export const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000
/** Pase lo que pase, la sesión dura como máximo 12 horas. */
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000
/** La última actividad se guarda como mucho una vez por minuto (menos escrituras). */
const TOUCH_INTERVAL_MS = 60 * 1000

const isProduction = env.NODE_ENV === 'production'
/**
 * En producción el prefijo __Host- obliga al navegador a aceptar la cookie solo si es Secure,
 * de este mismo dominio exacto y para todo el sitio (no la puede fijar un subdominio).
 */
export const SESSION_COOKIE = isProduction ? '__Host-es_admin' : 'es_admin'

/** Huella SHA-256 del token: en la base se guarda la huella, nunca el token real. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** Crea una sesión para el administrador y devuelve el token que irá en la cookie. */
export async function createSession(adminId: string) {
  const token = randomBytes(32).toString('base64url')
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminId,
      expiresAt: new Date(Date.now() + ABSOLUTE_TIMEOUT_MS),
    },
  })
  return token
}

/** Administrador dueño de la sesión. */
export interface SessionAdmin {
  id: string
  email: string
  name: string
}

/** Devuelve el administrador de una sesión vigente, o null. Renueva la última actividad. */
export async function findSession(token: string): Promise<SessionAdmin | null> {
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: { select: { id: true, email: true, name: true, isActive: true } } },
  })
  if (!session) return null

  const now = Date.now()
  const expired =
    session.expiresAt.getTime() <= now || now - session.lastSeenAt.getTime() > IDLE_TIMEOUT_MS
  if (expired || !session.admin.isActive) {
    await prisma.adminSession.deleteMany({ where: { id: session.id } })
    return null
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(now) },
    })
  }
  const { id, email, name } = session.admin
  return { id, email, name }
}

/** Borra la sesión (cerrar sesión). */
export async function deleteSession(token: string) {
  await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } })
}

/** Borra las sesiones caducadas (se llama al iniciar sesión: no hace falta otra tarea). */
export async function purgeExpiredSessions() {
  await prisma.adminSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: new Date() } },
        { lastSeenAt: { lt: new Date(Date.now() - IDLE_TIMEOUT_MS) } },
      ],
    },
  })
}

/** Lee la cookie de sesión de la petición (sin dependencias extra). */
export function readSessionToken(req: Request) {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    if (part.slice(0, separator).trim() === SESSION_COOKIE) {
      const value = part.slice(separator + 1).trim()
      // Un código válido son 43 caracteres base64url: cualquier otra cosa se ignora
      return /^[\w-]{43}$/.test(value) ? value : undefined
    }
  }
  return undefined
}

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
} as const

/** Envía la cookie de sesión (httpOnly) al navegador. */
export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: ABSOLUTE_TIMEOUT_MS })
}

/** Borra la cookie de sesión del navegador. */
export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions)
}

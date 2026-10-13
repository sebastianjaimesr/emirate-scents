import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { env } from '../config/env.js'
import { HttpError } from '../lib/httpError.js'
import { findSession, readSessionToken, type SessionAdmin } from './session.js'

/** Respuestas del panel: nunca en caché (ni del navegador ni de proxies) ni en buscadores. */
export const adminHeaders: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  res.set('X-Robots-Tag', 'noindex, nofollow')
  next()
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Protección contra peticiones falsificadas (CSRF). Toda petición que cambia datos debe
 * declarar que viene del propio panel: los navegadores envían la cabecera Origin en esas
 * peticiones y una página ajena no puede falsificarla. Se suma a la cookie SameSite=Strict.
 */
export const requireAdminOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()
  const origin = req.get('origin')
  if (!origin || !env.ADMIN_ORIGIN.includes(origin)) {
    throw new HttpError(403, 'FORBIDDEN_ORIGIN', 'Petición no permitida desde este sitio')
  }
  next()
}

/** Exige una sesión de administrador vigente. Sin ella: 401, sin excepción. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = readSessionToken(req)
  const admin = token ? await findSession(token) : null
  if (!admin) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar')
  }
  res.locals.admin = admin
  next()
}

/** Administrador de la petición actual (solo en rutas protegidas por requireAdmin). */
export function currentAdmin(res: Response): SessionAdmin {
  return res.locals.admin as SessionAdmin
}

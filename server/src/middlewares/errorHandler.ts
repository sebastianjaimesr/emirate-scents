import type { ErrorRequestHandler, RequestHandler } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/client.js'
import { HttpError } from '../lib/httpError.js'
import { logger } from '../lib/logger.js'
import { OrderStockShortageError } from '../services/admin/orderAdmin.js'
import { OrderItemsUnavailableError } from '../services/orderService.js'

/** Rutas que no existen: siempre JSON, nunca la página HTML por defecto de Express. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } })
}

/**
 * Último paso de cualquier petición que falla. Los errores esperados (validación,
 * no encontrado) se explican al cliente; los inesperados se registran completos
 * en el servidor y al cliente solo le llega un mensaje genérico, sin detalles internos.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Parámetros inválidos',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
    return
  }

  if (error instanceof OrderItemsUnavailableError) {
    res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message, items: error.items } })
    return
  }

  if (error instanceof OrderStockShortageError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, shortages: error.shortages },
    })
    return
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } })
    return
  }

  // Subida de fotos: archivo demasiado grande, más de un archivo, campo inesperado...
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE'
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: tooLarge ? 'La foto pesa más de 8 MB' : 'Envía una sola foto en el campo "imagen"',
      },
    })
    return
  }

  // Red de seguridad: si dos peticiones simultáneas chocan con una regla de unicidad o de
  // relación de la base de datos, se responde 409 en lugar de un error interno
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002' || error.code === 'P2003') {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'El cambio choca con otro registro. Recarga la página e inténtalo de nuevo.',
        },
      })
      return
    }
  }

  // JSON mal formado o cuerpo demasiado grande (lo detecta express.json)
  if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
    res.status(error.status ?? 400).json({
      error: { code: 'BAD_REQUEST', message: 'Cuerpo de la petición inválido' },
    })
    return
  }

  logger.error({ err: error, url: req.originalUrl }, 'Error inesperado')
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } })
}

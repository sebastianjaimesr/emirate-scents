import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { prisma } from '../lib/prisma.js'

/** Estado del servicio y de la base de datos (útil para el hosting en la Fase 8). */
export async function health(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'ok' })
  } catch (error) {
    logger.error({ err: error }, 'La base de datos no responde')
    res.status(503).json({ status: 'error', database: 'unavailable' })
  }
}

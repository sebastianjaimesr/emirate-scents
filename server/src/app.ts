import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { z } from 'zod'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { apiRouter } from './routes/index.js'

// Mensajes de validación en español
z.config(z.locales.es())

/**
 * Configuración de Express, separada del arranque (server.ts) para que las pruebas
 * puedan usar la app sin abrir un puerto real.
 */
export function createApp() {
  const app = express()

  // Cabeceras HTTP de seguridad (y oculta "X-Powered-By: Express")
  app.use(helmet())
  // Solo la tienda puede llamar a la API desde el navegador
  app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] }))
  app.use(express.json({ limit: '100kb' }))
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
      // Solo lo necesario para diagnosticar: sin cabeceras (cookies, IP completa...)
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  )

  // Límite general anti-abuso: 600 peticiones cada 15 minutos por dirección IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.',
      },
    },
  })

  app.use('/api', limiter, apiRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

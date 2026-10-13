import compression from 'compression'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { z } from 'zod'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { createAdminRouter } from './routes/admin.js'
import { apiRouter } from './routes/index.js'
import { UPLOADS_URL_PREFIX, uploadsRoot } from './storage/imageStorage.js'
import { seo } from './web/seo.js'
import { storefront } from './web/storefront.js'

// Mensajes de validación en español
z.config(z.locales.es())

/**
 * Configuración de Express, separada del arranque (server.ts) para que las pruebas
 * puedan usar la app sin abrir un puerto real.
 */
export function createApp() {
  const app = express()
  // Detrás del proxy del hosting, la IP real del cliente llega en X-Forwarded-For.
  // Sin esto, el límite anti-abuso trataría a todos los clientes como uno solo.
  app.set('trust proxy', env.TRUST_PROXY)

  // Cabeceras HTTP de seguridad (y oculta "X-Powered-By: Express")
  app.use(helmet())
  // Comprime las respuestas (el JavaScript de la tienda pesa unas 3 veces menos)
  app.use(compression())
  app.use(express.json({ limit: '100kb' }))
  app.use(
    pinoHttp({
      logger,
      // Solo las peticiones a la API: los archivos de la tienda llenarían el registro
      autoLogging: env.NODE_ENV !== 'test' && { ignore: (req) => !req.url?.startsWith('/api') },
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

  // Panel (/api/admin): sin CORS a propósito. Solo se usa desde su propia dirección, así que
  // el navegador bloquea cualquier llamada que venga de otro sitio (incluida la tienda).
  app.use('/api/admin', limiter, createAdminRouter())

  // Fotos subidas desde el panel. Nunca cambian (cada foto nueva tiene otra dirección), así
  // que se guardan en caché un año. Cross-Origin-Resource-Policy: la tienda en GitHub Pages
  // está en otro dominio y debe poder mostrarlas.
  app.use(
    UPLOADS_URL_PREFIX,
    (_req, res, next) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(uploadsRoot, {
      immutable: true,
      maxAge: '365d',
      index: false,
      fallthrough: true,
    }),
  )

  // API pública: solo la tienda puede llamarla desde el navegador, y sin cookies
  app.use('/api', cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] }), limiter, apiRouter)
  if (env.PUBLIC_URL) app.use(seo(env.PUBLIC_URL))
  if (env.SERVE_CLIENT) app.use(storefront())
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

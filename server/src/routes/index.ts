import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as catalog from '../controllers/catalogController.js'
import { health } from '../controllers/healthController.js'
import { postOrder } from '../controllers/orderController.js'
import { env } from '../config/env.js'

/** Mapa de la API: URL → controlador. Todo cuelga de /api (ver app.ts). */
export const apiRouter = Router()

apiRouter.get('/health', health)

apiRouter.get('/products', catalog.listProducts)
apiRouter.get('/products/:slug', catalog.getProduct)
apiRouter.get('/products/:slug/related', catalog.getRelatedProducts)

apiRouter.get('/catalog/filters', catalog.getFacets)
apiRouter.get('/catalog/highlights/:kind', catalog.getHighlights)
apiRouter.get('/catalog/lookup', catalog.lookupProducts)

apiRouter.get('/categories', catalog.listCategories)
apiRouter.get('/brands', catalog.listBrands)

// Límite estricto para crear pedidos (anti-abuso): 10 cada 15 minutos por dirección IP
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Has enviado muchos pedidos seguidos. Escríbenos por WhatsApp o intenta más tarde.',
    },
  },
})

apiRouter.post('/orders', orderLimiter, postOrder)

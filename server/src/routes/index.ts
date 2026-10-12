import { Router } from 'express'
import * as catalog from '../controllers/catalogController.js'
import { health } from '../controllers/healthController.js'

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

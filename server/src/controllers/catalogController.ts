import type { Request, Response } from 'express'
import { notFound } from '../lib/httpError.js'
import * as catalog from '../services/catalogService.js'
import {
  catalogQuerySchema,
  facetsQuerySchema,
  highlightParamsSchema,
  limitQuerySchema,
  lookupQuerySchema,
  slugParamsSchema,
} from '../validators/catalog.js'

/*
  Controladores: traducen la petición HTTP (URL, parámetros) a una llamada al servicio
  y su resultado a JSON. La validación con Zod ocurre aquí, antes de tocar la base de datos;
  si falla, el manejador de errores responde 400 con el detalle.
*/

export async function listProducts(req: Request, res: Response) {
  const query = catalogQuerySchema.parse(req.query)
  res.json(await catalog.listProducts(query))
}

export async function getProduct(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params)
  const product = await catalog.getProductBySlug(slug)
  if (!product) throw notFound('Producto no encontrado')
  res.json(product)
}

export async function getRelatedProducts(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params)
  const { limite } = limitQuerySchema.parse(req.query)
  const related = await catalog.getRelatedProducts(slug, limite)
  if (!related) throw notFound('Producto no encontrado')
  res.json({ items: related })
}

export async function getFacets(req: Request, res: Response) {
  const { categoria } = facetsQuerySchema.parse(req.query)
  res.json(await catalog.getFacets(categoria))
}

export async function getHighlights(req: Request, res: Response) {
  const { kind } = highlightParamsSchema.parse(req.params)
  const { limite } = limitQuerySchema.parse(req.query)
  res.json({ items: await catalog.getHighlightedProducts(kind, limite) })
}

export async function lookupProducts(req: Request, res: Response) {
  const { ids } = lookupQuerySchema.parse(req.query)
  res.json({ items: await catalog.getProductsByIds(ids) })
}

export async function listCategories(_req: Request, res: Response) {
  res.json({ items: await catalog.listCategories() })
}

export async function listBrands(_req: Request, res: Response) {
  res.json({ items: await catalog.listBrands() })
}

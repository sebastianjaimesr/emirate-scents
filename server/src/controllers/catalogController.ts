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

/** GET /api/catalog/products/:slug: un producto publicado; 404 si no existe. */
export async function getProduct(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params)
  const product = await catalog.getProductBySlug(slug)
  if (!product) throw notFound('Producto no encontrado')
  res.json(product)
}

/** Productos relacionados con uno dado. */
export async function getRelatedProducts(req: Request, res: Response) {
  const { slug } = slugParamsSchema.parse(req.params)
  const { limite } = limitQuerySchema.parse(req.query)
  const related = await catalog.getRelatedProducts(slug, limite)
  if (!related) throw notFound('Producto no encontrado')
  res.json({ items: related })
}

/**
 * Filtros disponibles (marcas, tamaños, familias y rango de precios) de una categoría o de todo el catálogo.
 */
export async function getFacets(req: Request, res: Response) {
  const { categoria } = facetsQuerySchema.parse(req.query)
  res.json(await catalog.getFacets(categoria))
}

/** Productos destacados (recomendados, novedades o más vendidos). */
export async function getHighlights(req: Request, res: Response) {
  const { kind } = highlightParamsSchema.parse(req.params)
  const { limite } = limitQuerySchema.parse(req.query)
  res.json({ items: await catalog.getHighlightedProducts(kind, limite) })
}

/** Productos por lista de ids (lo usa el carrito para tener precios y stock actualizados). */
export async function lookupProducts(req: Request, res: Response) {
  const { ids } = lookupQuerySchema.parse(req.query)
  res.json({ items: await catalog.getProductsByIds(ids) })
}

/** Lista de categorías. */
export async function listCategories(_req: Request, res: Response) {
  res.json({ items: await catalog.listCategories() })
}

/** Lista de marcas. */
export async function listBrands(_req: Request, res: Response) {
  res.json({ items: await catalog.listBrands() })
}

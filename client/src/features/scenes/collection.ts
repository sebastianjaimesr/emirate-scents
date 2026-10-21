import { getShowcaseProducts } from '../../services/productService'
import type { Product } from '../../types/product'

let cached: { at: number; request: Promise<Product[]> } | undefined

/**
 * Los perfumes que muestran las secciones 3D del inicio (los primeros "destacados" del
 * catálogo). Las tres secciones piden lo mismo: se hace una sola petición y se reutiliza
 * durante un minuto.
 */
export function getCollection() {
  const now = Date.now()
  if (!cached || now - cached.at > 60_000) {
    const request = getShowcaseProducts(8)
    cached = { at: now, request }
    // Si falla, la próxima vez se vuelve a intentar
    request.catch(() => {
      if (cached?.request === request) cached = undefined
    })
  }
  return cached.request
}

/** true si el perfume tiene al menos una nota olfativa registrada. */
export function hasNotes(product: Product) {
  const notes = product.notes
  return !!notes && notes.top.length + notes.heart.length + notes.base.length > 0
}

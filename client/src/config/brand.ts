/**
 * Datos oficiales de la marca. Son la única fuente de verdad:
 * si cambia el número o el Instagram, se cambia aquí y se actualiza toda la tienda.
 */
export const brand = {
  name: 'Emirate Scents',
  tagline: 'Exclusivity in every scent',
  /** Número en formato internacional sin "+", espacios ni guiones (57 = Colombia). */
  whatsappNumber: '573174096898',
  whatsappDisplay: '317 409 6898',
  instagramUrl: 'https://www.instagram.com/emirate_scents/',
  instagramHandle: '@emirate_scents',
} as const

/**
 * Anuncios de la barra superior. Solo deben añadirse anuncios reales y confirmados
 * por el negocio. Si la lista está vacía, la barra no se muestra.
 */
export const announcements: readonly string[] = []

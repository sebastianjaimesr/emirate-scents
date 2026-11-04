/** Dirección pública de la tienda ("" en desarrollo). La define vite.config.ts. */
export const siteUrl = import.meta.env.VITE_SITE_URL

/** Convierte una ruta de la tienda (/producto/x) en su dirección completa ("" sin siteUrl). */
export function absoluteUrl(path: string) {
  return siteUrl ? new URL(path.replace(/^\//, ''), siteUrl).href : ''
}

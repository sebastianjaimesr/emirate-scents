/**
 * Dirección final de una foto de producto.
 *
 * La API guarda direcciones relativas, que funcionan cuando la tienda y la API comparten
 * dominio (en tu computador, o todo en Railway). En GitHub Pages la tienda vive en otro
 * dominio y en una subcarpeta (/emirate-scents/), así que:
 * - las fotos subidas desde el panel (/uploads/...) se piden al dominio de la API;
 * - las fotos que vienen con la tienda (/images/...) se piden dentro de su subcarpeta.
 */
export function mediaUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('/uploads/')) return apiOrigin() + url
  if (url.startsWith('/')) return import.meta.env.BASE_URL + url.slice(1)
  return url
}

/** Dominio de la API cuando VITE_API_URL es una dirección completa; vacío si es relativa. */
function apiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return ''
  try {
    return new URL(apiUrl).origin
  } catch {
    return ''
  }
}

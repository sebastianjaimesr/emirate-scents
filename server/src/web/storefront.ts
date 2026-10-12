import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Router } from 'express'

/** Carpeta de la tienda ya compilada (`npm run build` la crea en client/dist). */
export const clientDistDir = fileURLToPath(new URL('../../../client/dist', import.meta.url))

/**
 * Sirve la tienda React desde la misma app que la API: un solo servicio que publicar,
 * un solo dominio y sin CORS.
 * - Los archivos de assets/ llevan su huella en el nombre (index-a1b2c3.js): el navegador
 *   puede guardarlos un año, porque si cambian, cambia el nombre.
 * - index.html nunca se guarda en caché, para que cada visita reciba la versión publicada.
 * - Cualquier otra dirección (/catalogo, /producto/...) devuelve index.html y React
 *   decide qué mostrar. Un archivo de assets/ que ya no existe (una pestaña abierta antes de
 *   publicar una versión nueva) responde 404 en lugar de la página.
 */
export function storefront(distDir = clientDistDir): Router {
  const indexHtml = path.join(distDir, 'index.html')
  if (!existsSync(indexHtml)) {
    throw new Error(
      `SERVE_CLIENT=true pero no existe ${indexHtml}. Ejecuta "npm run build" en la raíz del proyecto.`,
    )
  }

  const router = express.Router()
  router.use(
    express.static(distDir, {
      index: false,
      setHeaders: (res, filePath) => {
        const isFingerprinted = path.relative(distDir, filePath).split(path.sep)[0] === 'assets'
        res.setHeader(
          'Cache-Control',
          isFingerprinted ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
        )
      },
    }),
  )
  // (Excepto /api y /assets: un archivo que ya no existe debe dar 404, no la página)
  router.get(/^(?!\/(api|assets)(\/|$)).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexHtml)
  })
  return router
}

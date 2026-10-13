import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// En desarrollo y en `npm run preview`, las peticiones a /api y las fotos subidas desde el
// panel (/uploads) se redirigen al servidor Express (server/, puerto 4000). Así la tienda y la
// API parecen el mismo sitio y no hace falta configurar CORS en local.
const apiProxy = { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' }

/**
 * Ajustes de la vista previa de GitHub Pages (`npm run build:preview`):
 * - pide a los buscadores no indexarla (tiene productos DEMO);
 * - copia index.html como 404.html: GitHub Pages lo sirve en cualquier dirección que no
 *   sea un archivo (/emirate-scents/catalogo...), y React muestra la página correcta.
 */
function githubPagesPreview(): Plugin {
  let outDir = 'dist'
  return {
    name: 'github-pages-preview',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head' },
    ],
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // En la vista previa, la tienda vive en sebastianjaimesr.github.io/emirate-scents/
  base: mode === 'preview' ? '/emirate-scents/' : '/',
  plugins: [react(), tailwindcss(), ...(mode === 'preview' ? [githubPagesPreview()] : [])],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
}))

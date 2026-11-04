import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// En desarrollo y en `npm run preview`, las peticiones a /api y las fotos subidas desde el
// panel (/uploads) se redirigen al servidor Express (server/, puerto 4000). Así la tienda y la
// API parecen el mismo sitio y no hace falta configurar CORS en local.
const apiProxy = { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' }

/**
 * Ajustes de las versiones para GitHub Pages:
 * - `npm run build:preview`: vista previa con productos DEMO y sin servidor. Pide a los
 *   buscadores no indexarla.
 * - `npm run build:pages`: la tienda real, que pide los productos a la API de Railway
 *   (VITE_API_URL). Lleva una política de contenido (CSP) en el HTML, porque GitHub Pages no
 *   deja configurar cabeceras: el navegador solo ejecuta código de la propia tienda y solo
 *   habla con la API.
 * En las dos, index.html se copia como 404.html: GitHub Pages lo sirve en cualquier dirección
 * que no sea un archivo (/emirate-scents/catalogo...), y React muestra la página correcta.
 */
function githubPages(mode: string, apiUrl: string | undefined): Plugin {
  let outDir = 'dist'
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : ''
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // Motion anima con estilos en línea (style="transform: ...")
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${apiOrigin}`,
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(apiOrigin.startsWith('https://') ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
  return {
    name: 'github-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    transformIndexHtml: () =>
      mode === 'preview'
        ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head-prepend' }]
        : [
            {
              tag: 'meta',
              attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
              injectTo: 'head-prepend',
            },
          ],
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

/**
 * Etiquetas para redes sociales y buscadores que necesitan la dirección COMPLETA del sitio
 * (WhatsApp, Facebook o X no ejecutan JavaScript: leen solo el index.html).
 * Sin dirección conocida (desarrollo), se dejan las relativas de index.html.
 */
function absoluteSeoTags(siteUrl: string): Plugin {
  return {
    name: 'seo-absoluto',
    // Solo la imagen: la dirección canónica de cada página la pone PageMeta (React)
    // Vite ya antepuso la subcarpeta (/emirate-scents/...): se resuelve contra el dominio
    transformIndexHtml: (html) =>
      html.replace(
        /<meta property="og:image" content="(\/[^"]*)"/,
        (_match, path: string) =>
          `<meta property="og:image" content="${new URL(path, siteUrl).href}"`,
      ),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isPages = mode === 'preview' || mode === 'pages'
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL
  if (mode === 'pages' && !apiUrl?.match(/^https?:\/\//)) {
    throw new Error(
      'build:pages necesita VITE_API_URL con la dirección completa de la API, por ejemplo https://emirate-scents.up.railway.app/api',
    )
  }
  const base = isPages ? (process.env.PAGES_BASE ?? '/emirate-scents/') : '/'
  // Dirección pública de la tienda (termina en /). En GitHub Pages se conoce; en Railway se
  // indica con VITE_SITE_URL al compilar (ver docs/premium/entrega.md)
  const siteUrl =
    loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL?.replace(/\/?$/, '/') ??
    (isPages ? `https://sebastianjaimesr.github.io${base}` : '')
  return {
    // En GitHub Pages la tienda vive en una subcarpeta: sebastianjaimesr.github.io/emirate-scents/
    // (PAGES_BASE=/ si algún día usa un dominio propio)
    base,
    plugins: [
      react(),
      tailwindcss(),
      ...(isPages ? [githubPages(mode, apiUrl)] : []),
      ...(siteUrl ? [absoluteSeoTags(siteUrl)] : []),
    ],
    define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) },
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  }
})

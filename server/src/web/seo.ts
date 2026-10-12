import express, { type Router } from 'express'
import { prisma } from '../lib/prisma.js'

/** Páginas que no tiene sentido que Google muestre (son de cada visitante). */
const privatePaths = ['/carrito', '/favoritos', '/pedido']

/**
 * robots.txt y sitemap.xml para buscadores. El mapa del sitio se arma con los productos
 * publicados de la base de datos, así incluye los nuevos sin tocar el código.
 * Los productos DEMO nunca aparecen.
 */
export function seo(publicUrl: string): Router {
  const router = express.Router()

  router.get('/robots.txt', (_req, res) => {
    res
      .type('text/plain')
      .send(
        [
          'User-agent: *',
          ...privatePaths.map((p) => `Disallow: ${p}`),
          '',
          `Sitemap: ${publicUrl}/sitemap.xml`,
          '',
        ].join('\n'),
      )
  })

  router.get('/sitemap.xml', async (_req, res) => {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({ select: { slug: true }, orderBy: { position: 'asc' } }),
      prisma.product.findMany({
        where: { status: 'PUBLICADO', isDemo: false },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ])
    const entries = [
      { path: '/' },
      { path: '/catalogo' },
      ...categories.map((category) => ({ path: `/catalogo/${category.slug}` })),
      ...products.map((product) => ({
        path: `/producto/${product.slug}`,
        lastmod: product.updatedAt.toISOString().slice(0, 10),
      })),
    ]
    const urls = entries
      .map(
        (entry) =>
          `  <url><loc>${escapeXml(publicUrl + entry.path)}</loc>${
            'lastmod' in entry ? `<lastmod>${entry.lastmod}</lastmod>` : ''
          }</url>`,
      )
      .join('\n')
    res
      .type('application/xml')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      )
  })

  return router
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

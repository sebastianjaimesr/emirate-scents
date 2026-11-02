/**
 * Prepara las fotos de la portada (hero) a partir de las fotos de producto ya aprobadas.
 *
 *   npm run fotos:portada
 *
 * Qué perfumes salen en la portada se decide en client/src/content/hero-bottles.json
 * (solo perfumes ORIGINALES del catálogo: nunca equivalencias, porque la portada no puede
 * dar a entender que vendemos el perfume de otra marca).
 *
 * Por cada perfume crea AVIF (más liviano) y WebP (respaldo) en dos anchos, 480 y 800 px,
 * en client/public/images/hero/. El navegador elige el formato y el tamaño que necesita.
 * Si una foto de producto cambia (npm run fotos:descargar), basta con volver a ejecutarlo.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { catalogProducts } from '../prisma/data/products.catalog.js'

interface HeroBottle {
  key: string
  sku: string
  name: string
  brand: string
}

export const HERO_WIDTHS = [480, 800] as const

const root = fileURLToPath(new URL('../../', import.meta.url))
const bottles = JSON.parse(
  readFileSync(path.join(root, 'client/src/content/hero-bottles.json'), 'utf8'),
) as HeroBottle[]
const outputDir = path.join(root, 'client/public/images/hero')
mkdirSync(outputDir, { recursive: true })

for (const bottle of bottles) {
  const product = catalogProducts.find((entry) => entry.sku === bottle.sku)
  if (!product) throw new Error(`${bottle.sku} no está en el catálogo`)
  if (product.categorySlug === 'equivalencias')
    throw new Error(`${bottle.sku} es una equivalencia: no puede ir en la portada`)
  if (product.name !== bottle.name || product.brand.name !== bottle.brand)
    throw new Error(
      `${bottle.sku} se llama "${product.name}" de ${product.brand.name} en el catálogo`,
    )
  const url = product.images?.[0]?.url
  const file = url && path.join(root, 'client/public', url)
  if (!file || !existsSync(file)) throw new Error(`${bottle.sku} no tiene foto`)

  for (const width of HERO_WIDTHS) {
    const base = sharp(file).resize({ width, withoutEnlargement: true })
    const target = path.join(outputDir, `${bottle.key}-${width}`)
    await base.clone().avif({ quality: 62, effort: 6 }).toFile(`${target}.avif`)
    await base
      .clone()
      .webp({ quality: 86, smartSubsample: true, effort: 6 })
      .toFile(`${target}.webp`)
  }
  console.log(`  ✓ ${bottle.name} (${bottle.sku})`)
}

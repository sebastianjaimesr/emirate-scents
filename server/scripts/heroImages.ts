/**
 * Prepara las fotos de la portada (hero) a partir de las fotos de producto ya aprobadas.
 *
 *   npm run fotos:portada
 *
 * Qué perfumes salen en la portada se decide en client/src/content/hero-bottles.json
 * (solo perfumes ORIGINALES del catálogo: nunca equivalencias, porque la portada no puede
 * dar a entender que vendemos el perfume de otra marca).
 *
 * Usa la foto oficial con el fondo RECORTADO (docs/catalogo/fotos-oficiales/<SKU>.webp, con
 * transparencia): así el frasco queda sobre el fondo de la portada sin un rectángulo negro.
 * Si no hay recorte, usa la foto de producto (fondo negro).
 *
 * Por cada perfume crea AVIF (más liviano) y WebP (respaldo) en dos anchos, 480 y 800 px
 * (sin agrandar nunca la foto), en client/public/images/hero/, y anota el tamaño real en
 * client/src/content/hero-images.json para que la página reserve el espacio exacto.
 * Si una foto de producto cambia (npm run fotos:descargar), basta con volver a ejecutarlo.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { catalogProducts } from '../prisma/data/products.catalog.js'

interface HeroBottle {
  key: string
  sku: string
  slug: string
  name: string
  brand: string
}

export const HERO_WIDTHS = [480, 800] as const

const root = fileURLToPath(new URL('../../', import.meta.url))
const bottles = JSON.parse(
  readFileSync(path.join(root, 'client/src/content/hero-bottles.json'), 'utf8'),
) as HeroBottle[]
const outputDir = path.join(root, 'client/public/images/hero')
// Se borra la carpeta: así no quedan fotos de perfumes que ya no salen en la portada
rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })
const manifest: Record<string, { widths: number[]; width: number; height: number }> = {}

for (const bottle of bottles) {
  const product = catalogProducts.find((entry) => entry.sku === bottle.sku)
  if (!product) throw new Error(`${bottle.sku} no está en el catálogo`)
  if (product.categorySlug === 'equivalencias')
    throw new Error(`${bottle.sku} es una equivalencia: no puede ir en la portada`)
  if (
    product.name !== bottle.name ||
    product.brand.name !== bottle.brand ||
    product.slug !== bottle.slug
  )
    throw new Error(
      `${bottle.sku} se llama "${product.name}" de ${product.brand.name} en el catálogo`,
    )
  const cutout = path.join(root, 'docs/catalogo/fotos-oficiales', `${bottle.sku}.webp`)
  const url = product.images?.[0]?.url
  const file = existsSync(cutout) ? cutout : url && path.join(root, 'client/public', url)
  if (!file || !existsSync(file)) throw new Error(`${bottle.sku} no tiene foto`)

  // trim() quita los bordes vacíos para que el frasco ocupe toda la imagen
  const source = await sharp(file).trim().toBuffer({ resolveWithObject: true })
  const widths = HERO_WIDTHS.map((width) => Math.min(width, source.info.width))
  manifest[bottle.key] = {
    widths,
    width: source.info.width,
    height: source.info.height,
  }

  for (const [index, width] of widths.entries()) {
    const base = sharp(source.data).resize({ width, withoutEnlargement: true })
    const target = path.join(outputDir, `${bottle.key}-${HERO_WIDTHS[index]}`)
    await base.clone().avif({ quality: 62, effort: 6 }).toFile(`${target}.avif`)
    await base
      .clone()
      .webp({ quality: 86, smartSubsample: true, effort: 6 })
      .toFile(`${target}.webp`)
  }
  console.log(`  ✓ ${bottle.name} (${bottle.sku})`)
}

writeFileSync(
  path.join(root, 'client/src/content/hero-images.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

/**
 * Dibuja el frasco ilustrado de Emirate Scents para cada equivalencia ("Inspirado en …")
 * y lo anota como fuente en product-photos.sources.json.
 *
 *   npm run fotos:equivalencias     → crea las ilustraciones que falten
 *   npm run fotos:descargar         → después: las optimiza y las conecta al catálogo
 *
 * Fondo negro, como el escenario de las fotos de la tienda (.photo-stage en client/src/index.css).
 * Para volver a dibujarlas, borra los PNG de docs/catalogo/ilustraciones-equivalencias/ y ejecuta
 * después `npm run fotos:descargar -- --reemplazar`.
 *
 * Es una ilustración propia con el logo de la tienda: nunca imita el frasco ni la marca
 * del perfume original. Si una equivalencia ya tiene otra fuente (por ejemplo, una foto
 * propia), no se toca.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { catalogProducts } from '../prisma/data/products.catalog.js'
import type { PhotoSource } from './productPhotos.js'

export const ILLUSTRATION_SOURCE = 'Ilustración de Emirate Scents'

const root = fileURLToPath(new URL('../../', import.meta.url))
const sourcesPath = path.join(root, 'server/prisma/data/product-photos.sources.json')
const logoPath = path.join(root, 'client/public/images/brand/logo-emirate-scents.webp')
const outputDir = 'docs/catalogo/ilustraciones-equivalencias'

/** Las ilustraciones se dibujan a 1600 × 2000 (4:5): alcanzan para la copia Retina de 1200 × 1500. */
const SCALE = 2

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Parte el nombre en líneas de hasta ~15 letras para que quepa en la etiqueta. */
function labelLines(name: string, max = 15): string[] {
  const lines: string[] = []
  for (const word of name.split(/\s+/)) {
    const last = lines.at(-1)
    if (last !== undefined && `${last} ${word}`.length <= max)
      lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines.slice(0, 3)
}

/**
 * Frasco genérico de la Línea Equivalencias (el mismo para todas, como el frasco real de la
 * línea), con el nombre de la equivalencia en la etiqueta para que cada una se distinga.
 */
const bottle = (number: string, inspiredBy: string) => {
  const lines = labelLines(inspiredBy.toUpperCase())
  const nameSize = lines.length > 2 ? 17 : 19
  const firstLine = 694 - ((lines.length - 1) * (nameSize + 4)) / 2
  const nameText = lines
    .map(
      (line, i) =>
        `<text x="400" y="${firstLine + i * (nameSize + 4)}" text-anchor="middle" font-family="Caladea, Liberation Serif, serif" font-size="${nameSize}" letter-spacing="1.5" fill="#e3c77f">${escapeXml(line)}</text>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${800 * SCALE}" height="${1000 * SCALE}" viewBox="0 0 800 1000">
<defs>
 <linearGradient id="glass" x1="0" x2="1"><stop offset="0" stop-color="#d9b77a"/><stop offset=".18" stop-color="#f3dfb4"/><stop offset=".5" stop-color="#e4c68e"/><stop offset=".85" stop-color="#b98a45"/><stop offset="1" stop-color="#9c6f33"/></linearGradient>
 <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd8" stop-opacity=".9"/><stop offset="1" stop-color="#e9d3a6" stop-opacity=".6"/></linearGradient>
 <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#8a6420"/><stop offset=".3" stop-color="#e8cf8a"/><stop offset=".55" stop-color="#b8892f"/><stop offset="1" stop-color="#7a5518"/></linearGradient>
 <linearGradient id="cap" x1="0" x2="1"><stop offset="0" stop-color="#0c0c0c"/><stop offset=".35" stop-color="#3a3a3a"/><stop offset=".6" stop-color="#151515"/><stop offset="1" stop-color="#050505"/></linearGradient>
 <radialGradient id="shadow"><stop offset="0" stop-color="#c9a45c" stop-opacity=".22"/><stop offset="1" stop-color="#c9a45c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="1000" fill="#000"/>
<ellipse cx="400" cy="905" rx="230" ry="26" fill="url(#shadow)"/>
<rect x="230" y="380" width="340" height="520" rx="34" fill="url(#glass)"/>
<rect x="230" y="380" width="340" height="80" rx="34" fill="url(#top)"/>
<rect x="252" y="400" width="18" height="470" rx="9" fill="#fff" opacity=".45"/>
<rect x="530" y="420" width="8" height="420" rx="4" fill="#fff" opacity=".25"/>
<rect x="362" y="330" width="76" height="58" fill="url(#gold)"/>
<rect x="300" y="160" width="200" height="176" rx="10" fill="url(#cap)"/>
<rect x="300" y="300" width="200" height="14" fill="url(#gold)"/>
<rect x="322" y="176" width="10" height="110" rx="5" fill="#fff" opacity=".18"/>
<rect x="275" y="505" width="250" height="300" rx="4" fill="#0d0d0d"/>
<rect x="285" y="515" width="230" height="280" rx="2" fill="none" stroke="#c9a24f" stroke-width="2"/>
<text x="400" y="648" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="3" fill="#a8884a">INSPIRADO EN</text>
${nameText}
<line x1="360" y1="748" x2="440" y2="748" stroke="#c9a24f" stroke-width="1"/>
<text x="400" y="768" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="2" fill="#c9a24f">LÍNEA EQUIVALENCIAS · N.º ${number}</text>
</svg>`
}

const sources = existsSync(sourcesPath)
  ? (JSON.parse(readFileSync(sourcesPath, 'utf8')) as PhotoSource[])
  : []
const logo = await sharp(logoPath)
  .resize(Math.round(110 * SCALE), Math.round(110 * SCALE), {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer()
mkdirSync(path.join(root, outputDir), { recursive: true })

let created = 0
for (const product of catalogProducts.filter((entry) => entry.categorySlug === 'equivalencias')) {
  const existing = sources.find((entry) => entry.sku === product.sku)
  if (existing && existing.source !== ILLUSTRATION_SOURCE) continue
  const origin = `${outputDir}/${product.sku}.png`
  if (!existsSync(path.join(root, origin))) {
    const number = product.sku.slice(-2)
    const inspiredBy = product.name.replace(/^Inspirado en /, '')
    await sharp(Buffer.from(bottle(number, inspiredBy)))
      .composite([{ input: logo, left: Math.round(345 * SCALE), top: Math.round(522 * SCALE) }])
      .png()
      .toFile(path.join(root, origin))
    created++
  }
  if (!existing)
    sources.push({
      sku: product.sku,
      file: `emirate-${product.slug}`,
      origin,
      source: ILLUSTRATION_SOURCE,
    })
}

writeFileSync(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`)
console.log(`Ilustraciones nuevas: ${created}. Ahora ejecuta: npm run fotos:descargar`)

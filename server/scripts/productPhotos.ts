/**
 * Descarga, revisa y optimiza las fotos de producto que se listan en
 * server/prisma/data/product-photos.sources.json, y las conecta al catálogo.
 *
 *   npm run fotos:descargar                      → procesa las fuentes nuevas o cambiadas
 *   npm run fotos:descargar -- --solo AR-0006    → solo ese SKU (puedes repetir --solo)
 *   npm run fotos:descargar -- --reemplazar      → permite cambiar una foto ya aprobada
 *   npm run fotos:descargar -- --revisar         → no descarga nada: solo informa
 *
 * Cada fuente dice de dónde sale la foto: una URL https (sitio oficial o distribuidor)
 * o un archivo local (una foto propia), relativo a la raíz del repositorio.
 * El resultado se guarda en client/public/images/products/<SKU>/<archivo>.webp
 * (800 × 1000, fondo blanco, el frasco centrado) y en product-photos.json, que es lo
 * que lee el catálogo. Se puede ejecutar las veces que haga falta: lo que ya está hecho
 * con la misma fuente se salta, y una foto aprobada no se pisa sin --reemplazar.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { catalogProducts } from '../prisma/data/products.catalog.js'

export interface PhotoSource {
  sku: string
  /** Nombre del archivo sin extensión, por ejemplo lattafa-asad */
  file: string
  /** URL https de la imagen, o ruta a un archivo local desde la raíz del repositorio */
  origin: string
  /** Página donde se ve el producto (para comprobar que es el perfume exacto) */
  sourcePage?: string
  /** Quién publica la foto: "Lattafa (sitio oficial)", "Foto propia"… */
  source: string
}

export interface PhotoRecord {
  url: string
  file: string
  origin: string
  sourcePage?: string
  source: string
  /** Huella del archivo original: si dos productos la comparten, uno tiene la foto equivocada */
  sha256: string
  originalWidth: number
  originalHeight: number
  bytes: number
  savedAt: string
}

const root = fileURLToPath(new URL('../../', import.meta.url))
const dataDir = path.join(root, 'server/prisma/data')
const sourcesPath = path.join(dataDir, 'product-photos.sources.json')
const recordsPath = path.join(dataDir, 'product-photos.json')
const photosDir = path.join(root, 'client/public/images/products')

const WIDTH = 800
const HEIGHT = 1000
/** El frasco ocupa como máximo este espacio: deja un margen blanco parejo en todas las fotos */
const INNER_WIDTH = 680
const INNER_HEIGHT = 880
/** Por debajo de esto la foto se vería pixelada en la ficha del producto */
const MIN_LONG_SIDE = 700
const MAX_BYTES = 25 * 1024 * 1024
const ATTEMPTS = 3

const args = process.argv.slice(2)
const only = args.flatMap((arg, i) => (arg === '--solo' && args[i + 1] ? [args[i + 1]!] : []))
const replace = args.includes('--reemplazar')
const reviewOnly = args.includes('--revisar')

const readJson = <T>(file: string, empty: T): T =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : empty

const sources = readJson<PhotoSource[]>(sourcesPath, [])
const records = readJson<Record<string, PhotoRecord>>(recordsPath, {})
const skus = new Set(catalogProducts.map((product) => product.sku))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function download(url: string): Promise<Buffer> {
  let lastError: unknown
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EmirateScents-fotos/1.0', Accept: 'image/*' },
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`el servidor respondió ${response.status}`)
      const type = response.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) throw new Error(`no es una imagen (${type || 'sin tipo'})`)
      const body = Buffer.from(await response.arrayBuffer())
      if (body.length > MAX_BYTES) throw new Error('pesa más de 25 MB')
      return body
    } catch (error) {
      // fetch dice solo "fetch failed": el motivo real (red bloqueada, DNS…) viene en cause
      const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null
      lastError = cause ? new Error(`no se pudo conectar (${cause.message})`) : error
      // 4xx no mejora reintentando
      if (error instanceof Error && /respondió 4\d\d|no es una imagen|25 MB/.test(error.message))
        break
      if (attempt < ATTEMPTS) await wait(2000 * 2 ** (attempt - 1))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function readOrigin(origin: string): Promise<Buffer> {
  if (/^https:\/\//.test(origin)) return download(origin)
  if (/^http:\/\//.test(origin)) throw new Error('usa una URL https')
  const file = path.resolve(root, origin)
  if (!existsSync(file)) throw new Error(`no existe el archivo ${origin}`)
  return readFileSync(file)
}

/** Fondo blanco, recorta los bordes vacíos y centra el frasco en un lienzo 4:5. */
async function optimize(
  original: Buffer,
): Promise<{ webp: Buffer; width: number; height: number }> {
  // failOn 'error': un archivo dañado o que no es imagen se rechaza aquí
  const meta = await sharp(original, { failOn: 'error' }).metadata()
  const width = meta.autoOrient?.width ?? meta.width
  const height = meta.autoOrient?.height ?? meta.height
  if (!width || !height) throw new Error('no se pudo leer el tamaño de la imagen')
  if (Math.max(width, height) < MIN_LONG_SIDE)
    throw new Error(`es muy pequeña (${width}×${height}; mínimo ${MIN_LONG_SIDE} px de lado mayor)`)

  const white = { r: 255, g: 255, b: 255, alpha: 1 }
  const flat = await sharp(original).rotate().flatten({ background: white }).toBuffer()
  let trimmed = flat
  try {
    trimmed = await sharp(flat).trim({ background: white, threshold: 12 }).toBuffer()
  } catch {
    // Sin bordes blancos que recortar: se usa entera
  }
  const fitted = await sharp(trimmed)
    .resize(INNER_WIDTH, INNER_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true })
  const left = Math.floor((WIDTH - fitted.info.width) / 2)
  const top = Math.floor((HEIGHT - fitted.info.height) / 2)
  const webp = await sharp(fitted.data)
    .extend({
      left,
      right: WIDTH - fitted.info.width - left,
      top,
      bottom: HEIGHT - fitted.info.height - top,
      background: white,
    })
    // smartSubsample y calidad alta: las letras de la etiqueta no se emborronan
    .webp({ quality: 88, smartSubsample: true, effort: 6 })
    .toBuffer()
  return { webp, width, height }
}

const problems: string[] = []
let saved = 0
let skipped = 0
const hashes = new Map(Object.entries(records).map(([sku, record]) => [record.sha256, sku]))

for (const entry of sources) {
  if (only.length > 0 && !only.includes(entry.sku)) continue
  const label = `${entry.sku} (${entry.file})`
  if (!skus.has(entry.sku)) {
    problems.push(`${label}: ese SKU no está en el catálogo`)
    continue
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.file)) {
    problems.push(`${label}: el nombre de archivo solo puede tener minúsculas, números y guiones`)
    continue
  }
  const current = records[entry.sku]
  const output = path.join(photosDir, entry.sku, `${entry.file}.webp`)
  if (current?.origin === entry.origin && existsSync(output)) {
    skipped++
    continue
  }
  if (current && current.origin !== entry.origin && !replace) {
    problems.push(
      `${label}: ya tiene una foto aprobada de otra fuente; usa --reemplazar para cambiarla`,
    )
    continue
  }
  if (reviewOnly) {
    console.log(`  pendiente: ${label} ← ${entry.origin}`)
    continue
  }

  try {
    const original = await readOrigin(entry.origin)
    const sha256 = createHash('sha256').update(original).digest('hex')
    const owner = hashes.get(sha256)
    if (owner && owner !== entry.sku)
      throw new Error(`es la misma imagen que ya usa ${owner}: revisa que sea el perfume correcto`)
    const { webp, width, height } = await optimize(original)
    mkdirSync(path.dirname(output), { recursive: true })
    writeFileSync(output, webp)
    records[entry.sku] = {
      url: `/images/products/${entry.sku}/${entry.file}.webp`,
      file: `${entry.file}.webp`,
      origin: entry.origin,
      sourcePage: entry.sourcePage,
      source: entry.source,
      sha256,
      originalWidth: width,
      originalHeight: height,
      bytes: webp.length,
      savedAt: new Date().toISOString(),
    }
    hashes.set(sha256, entry.sku)
    // Se guarda tras cada foto: si algo falla a mitad, no se pierde lo ya hecho
    writeFileSync(recordsPath, `${JSON.stringify(records, null, 2)}\n`)
    saved++
    console.log(`  ✓ ${label}: ${width}×${height} → ${Math.round(webp.length / 1024)} KB`)
  } catch (error) {
    problems.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const missing = catalogProducts.filter((product) => !records[product.sku])
console.log(`\nFotos nuevas: ${saved} · ya estaban: ${skipped} · con problemas: ${problems.length}`)
for (const problem of problems) console.log(`  ✗ ${problem}`)
console.log(`\nProductos sin foto nueva (${missing.length} de ${catalogProducts.length}):`)
for (const product of missing) console.log(`  - ${product.sku} ${product.name}`)
if (problems.length > 0) process.exitCode = 1

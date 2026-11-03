/**
 * Inventario de las fotos del catálogo: una fila por producto con su foto actual, la anterior,
 * la fuente, la resolución, el formato y el estado de revisión.
 *
 *   npm run fotos:inventario   → escribe docs/catalogo/inventario-fotos.csv
 *
 * Lee el catálogo (products.catalog.ts), las fuentes (product-photos.sources.json) y las fotos
 * ya procesadas (product-photos.json). No descarga ni cambia ninguna foto.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogProducts } from '../prisma/data/products.catalog.js'
import type { PhotoRecord, PhotoSource } from './productPhotos.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const dataDir = path.join(root, 'server/prisma/data')
const output = path.join(root, 'docs/catalogo/inventario-fotos.csv')

const sources = JSON.parse(
  readFileSync(path.join(dataDir, 'product-photos.sources.json'), 'utf8'),
) as PhotoSource[]
const records = JSON.parse(
  readFileSync(path.join(dataDir, 'product-photos.json'), 'utf8'),
) as Record<string, PhotoRecord>

const columns = [
  'sku',
  'producto',
  'marca',
  'categoria',
  'imagen_anterior',
  'imagen_nueva',
  'fuente',
  'pagina_del_producto',
  'imagen_original',
  'resolucion_descargada',
  'resolucion_del_frasco',
  'formato',
  'tamanos_publicados',
  'verificacion',
  'implementacion',
  'nota',
] as const

const csvCell = (value: unknown) => {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const rows = catalogProducts.map((product) => {
  const source = sources.find((entry) => entry.sku === product.sku)
  const record = records[product.sku]
  const file = record && path.join(root, 'client/public', record.url)
  const published = !!file && existsSync(file)
  const verification = !record
    ? 'pendiente'
    : (source?.verification ?? (record.source.startsWith('Ilustración') ? 'pendiente' : 'revisar'))
  return {
    sku: product.sku,
    producto: product.name,
    marca: product.brand.name,
    categoria: product.categorySlug,
    imagen_anterior: record?.previous?.url ?? (record ? '(sin cambio de fuente)' : ''),
    imagen_nueva: record?.url ?? '',
    fuente: record?.source ?? '',
    pagina_del_producto: record?.sourcePage ?? '',
    imagen_original: record?.imageUrl ?? (record?.origin.startsWith('http') ? record.origin : ''),
    resolucion_descargada: source?.downloadedSize ?? '',
    resolucion_del_frasco: record ? `${record.originalWidth}×${record.originalHeight}` : '',
    formato: record ? 'WebP' : '',
    tamanos_publicados: record?.widths?.map((width) => `${width}×${width * 1.25}`).join(' · '),
    verificacion: verification,
    implementacion: published ? 'publicada' : record ? 'falta el archivo' : 'sin foto',
    nota: source?.note ?? '',
  }
})

const csv = [
  columns.join(','),
  ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
].join('\n')
// BOM: Excel abre bien las tildes
writeFileSync(output, `﻿${csv}\n`)

const count = (status: string) => rows.filter((row) => row.verificacion === status).length
console.log(
  `Inventario: ${rows.length} productos · verificadas ${count('verificada')} · revisar ${count('revisar')} · pendientes ${count('pendiente')}`,
)
console.log(`→ ${path.relative(root, output)}`)

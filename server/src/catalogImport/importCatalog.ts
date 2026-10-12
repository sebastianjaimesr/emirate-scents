import { existsSync } from 'node:fs'
import path from 'node:path'
import type { PrismaClient } from '../generated/prisma/client.js'
import { buildSearchText, normalizeText } from '../lib/text.js'
import { parseCsv } from './csv.js'
import { type CatalogRow, catalogColumns, catalogRowSchema } from './rowSchema.js'

export interface ImportProblem {
  /** Fila de la hoja de cálculo (la 1 es la de los títulos). */
  line: number
  sku?: string
  column?: string
  message: string
}

export interface ValidatedRow extends CatalogRow {
  line: number
}

/** Ruta pública de una foto: client/public/images/products/<SKU>/<archivo>. */
export const photoUrl = (sku: string, file: string) => `/images/products/${sku}/${file}`

export const slugify = (value: string) => normalizeText(value).trim().replace(/\s+/g, '-')

/**
 * Revisa todo el archivo sin tocar la base de datos y devuelve cada problema con su fila,
 * para corregirlos todos de una vez en Excel.
 */
export function validateCatalog(csvText: string, photosDir: string) {
  const problems: ImportProblem[] = []
  const rows: ValidatedRow[] = []
  const [header = [], ...data] = parseCsv(csvText)
  const columns = header.map((name) => name.trim().toLowerCase())

  const missing = catalogColumns.filter((column) => !columns.includes(column))
  if (missing.length > 0) {
    problems.push({ line: 1, message: `Faltan columnas: ${missing.join(', ')}` })
    return { rows, problems }
  }

  const seenSkus = new Map<string, number>()
  data.forEach((cells, index) => {
    const line = index + 2
    const raw = Object.fromEntries(columns.map((column, i) => [column, cells[i] ?? '']))
    // Los repetidos se detectan aunque la fila tenga otros errores
    const rawSku = String(raw.sku ?? '')
      .trim()
      .toUpperCase()
    const previous = rawSku ? seenSkus.get(rawSku) : undefined
    if (previous) {
      problems.push({
        line,
        sku: rawSku,
        column: 'sku',
        message: `Repetido (ya está en la fila ${previous})`,
      })
      return
    }
    if (rawSku) seenSkus.set(rawSku, line)

    const result = catalogRowSchema.safeParse(raw)
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push({
          line,
          sku: String(raw.sku ?? '').trim() || undefined,
          column: issue.path.join('.') || undefined,
          message: issue.message,
        })
      }
      return
    }
    const row = result.data
    for (const file of row.fotos) {
      if (!/^[\w.-]+\.(jpe?g|png|webp|avif)$/i.test(file)) {
        problems.push({
          line,
          sku: row.sku,
          column: 'fotos',
          message: `"${file}" no es un nombre de foto válido`,
        })
      } else if (!existsSync(path.join(photosDir, row.sku, file))) {
        problems.push({
          line,
          sku: row.sku,
          column: 'fotos',
          message: `No encuentro ${file} en client/public/images/products/${row.sku}/`,
        })
      }
    }
    rows.push({ ...row, line })
  })

  return { rows, problems }
}

/**
 * Guarda los productos en una sola transacción: o entran todos, o ninguno.
 * - Busca cada producto por su sku: si existe lo actualiza (conserva su dirección web),
 *   si no, lo crea publicado.
 * - Los productos que no están en el archivo no se tocan.
 * - Con retireDemo, los productos DEMO pasan a ARCHIVADO y desaparecen de la tienda.
 */
export async function applyCatalog(
  prisma: PrismaClient,
  rows: ValidatedRow[],
  { retireDemo = false } = {},
) {
  return prisma.$transaction(
    async (tx) => {
      const categories = new Map(
        (await tx.category.findMany({ select: { id: true, slug: true } })).map((c) => [
          c.slug,
          c.id,
        ]),
      )
      // Los productos existentes conservan su dirección: los nuevos no pueden repetirla
      const takenSlugs = new Set(
        (await tx.product.findMany({ select: { slug: true } })).map((product) => product.slug),
      )
      let created = 0
      let updated = 0

      for (const row of rows) {
        const categoryId = categories.get(row.categoria)
        if (!categoryId)
          throw new Error(`La categoría ${row.categoria} no existe: ejecuta npm run db:seed`)

        const brandSlug = slugify(row.marca)
        const brand = await tx.brand.upsert({
          where: { slug: brandSlug },
          create: { slug: brandSlug, name: row.marca },
          update: { name: row.marca },
        })

        const data = {
          name: row.nombre,
          brandId: brand.id,
          categoryId,
          shortDescription: row.descripcion_corta,
          description: row.descripcion,
          price: row.precio_cop,
          compareAtPrice: row.precio_anterior_cop ?? null,
          sizeMl: row.tamano_ml ?? null,
          concentration: row.concentracion ?? null,
          olfactoryFamily: row.familia_olfativa ?? null,
          notesTop: row.notas_salida,
          notesHeart: row.notas_corazon,
          notesBase: row.notas_fondo,
          audience: row.publico ?? null,
          inspirationReference: row.referencia_equivalencia ?? null,
          stock: row.inventario,
          isNew: row.nuevo,
          isFeatured: row.recomendado,
          isDemo: false,
          status: 'PUBLICADO' as const,
          searchText: buildSearchText({
            name: row.nombre,
            brandName: row.marca,
            olfactoryFamily: row.familia_olfativa,
            notesTop: row.notas_salida,
            notesHeart: row.notas_corazon,
            notesBase: row.notas_fondo,
          }),
        }
        const sizeLabel = row.tamano_ml ? `, ${row.tamano_ml} ml` : ''
        const images = row.fotos.map((file, position) => ({
          url: photoUrl(row.sku, file),
          alt: `${row.nombre} de ${row.marca}${sizeLabel}${position > 0 ? ` (foto ${position + 1})` : ''}`,
          position,
        }))

        const existing = await tx.product.findUnique({
          where: { sku: row.sku },
          select: { id: true },
        })
        if (existing) {
          await tx.productImage.deleteMany({ where: { productId: existing.id } })
          await tx.product.update({
            where: { id: existing.id },
            data: { ...data, images: { create: images } },
          })
          updated++
        } else {
          let slug = slugify(`${row.nombre} ${row.tamano_ml ? `${row.tamano_ml}ml` : ''}`)
          if (takenSlugs.has(slug)) slug = `${slug}-${row.sku.toLowerCase()}`
          takenSlugs.add(slug)
          await tx.product.create({
            data: {
              ...data,
              sku: row.sku,
              slug,
              publishedAt: new Date(),
              images: { create: images },
            },
          })
          created++
        }
      }

      const archivedDemo = retireDemo
        ? (await tx.product.updateMany({ where: { isDemo: true }, data: { status: 'ARCHIVADO' } }))
            .count
        : 0

      return { created, updated, archivedDemo }
    },
    { timeout: 120_000 },
  )
}

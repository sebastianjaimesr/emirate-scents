/**
 * Pruebas de la importación del catálogo desde CSV.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { parseCsv } from '../src/catalogImport/csv.js'
import { applyCatalog, validateCatalog } from '../src/catalogImport/importCatalog.js'
import { catalogColumns } from '../src/catalogImport/rowSchema.js'
import { prisma } from '../src/lib/prisma.js'
import { resetCatalog } from './fixtures.js'

/** Carpeta temporal con fotos falsas para la prueba. */
const photosDir = mkdtempSync(path.join(tmpdir(), 'fotos-'))
mkdirSync(path.join(photosDir, 'AR-0001'))
writeFileSync(path.join(photosDir, 'AR-0001', 'frente.webp'), '')

/** Fila de títulos del CSV. */
const header = catalogColumns.join(',')
const baseRow: Record<string, string> = {
  sku: 'AR-0001',
  nombre: 'Oud Real',
  marca: 'Casa Prueba',
  categoria: 'perfumes-arabes',
  descripcion_corta: 'Oud intenso',
  descripcion: 'Descripción completa, con coma',
  precio_cop: '285.000',
  tamano_ml: '100',
  concentracion: 'edp',
  notas_salida: 'Azafrán; Bergamota',
  inventario: '6',
  nuevo: 'si',
  fotos: 'frente.webp',
}
/** Convierte una fila en una línea CSV con comillas. */
const csvLine = (row: Record<string, string>) =>
  catalogColumns.map((column) => `"${(row[column] ?? '').replaceAll('"', '""')}"`).join(',')
/** Arma un CSV completo con la fila de títulos y las filas indicadas. */
const csv = (...rows: Record<string, string>[]) => [header, ...rows.map(csvLine)].join('\r\n')

afterAll(async () => {
  rmSync(photosDir, { recursive: true, force: true })
  await prisma.$disconnect()
})

describe('parseCsv', () => {
  it('entiende comillas, comas dentro de celdas, BOM y saltos de Windows', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","di ""hola"""\r\n\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'di "hola"'],
    ])
  })

  it('acepta el separador ";" de Excel en español', () => {
    expect(parseCsv('a;b\n1;"Rosa; Oud"')).toEqual([
      ['a', 'b'],
      ['1', 'Rosa; Oud'],
    ])
  })
})

describe('validateCatalog', () => {
  it('convierte una fila válida', () => {
    const { rows, problems } = validateCatalog(csv(baseRow), photosDir)
    expect(problems).toEqual([])
    expect(rows[0]).toMatchObject({
      sku: 'AR-0001',
      precio_cop: 285000,
      tamano_ml: 100,
      concentracion: 'EDP',
      notas_salida: ['Azafrán', 'Bergamota'],
      notas_corazon: [],
      nuevo: true,
      recomendado: false,
      precio_anterior_cop: undefined,
      line: 2,
    })
  })

  it('reporta cada problema con su fila y columna', () => {
    const { problems } = validateCatalog(
      csv(
        { ...baseRow, precio_cop: '285000,50', fotos: 'otra.jpg' },
        { ...baseRow, sku: 'NI-0002', precio_anterior_cop: '100000' },
        { ...baseRow, fotos: '' },
      ),
      photosDir,
    )
    expect(problems).toEqual([
      expect.objectContaining({ line: 2, column: 'precio_cop' }),
      expect.objectContaining({ line: 3, column: 'precio_anterior_cop' }),
      expect.objectContaining({ line: 3, column: 'sku', message: expect.stringContaining('AR-') }),
      expect.objectContaining({
        line: 4,
        column: 'sku',
        message: expect.stringContaining('Repetido'),
      }),
    ])
  })

  it('avisa si una foto no está en su carpeta', () => {
    const { problems } = validateCatalog(csv({ ...baseRow, fotos: 'falta.jpg' }), photosDir)
    expect(problems).toEqual([
      expect.objectContaining({
        line: 2,
        column: 'fotos',
        message: expect.stringContaining('falta.jpg'),
      }),
    ])
  })

  it('exige todas las columnas de la plantilla', () => {
    const { problems } = validateCatalog('sku,nombre\nAR-0001,Oud', photosDir)
    expect(problems[0]?.message).toMatch(/Faltan columnas: marca/)
  })
})

describe('applyCatalog', () => {
  beforeEach(resetCatalog)

  it('crea productos publicados con marca, fotos y búsqueda', async () => {
    const { rows } = validateCatalog(csv(baseRow), photosDir)
    expect(await applyCatalog(prisma, rows)).toEqual({ created: 1, updated: 0, archivedDemo: 0 })
    const product = await prisma.product.findUniqueOrThrow({
      where: { sku: 'AR-0001' },
      include: { brand: true, images: true },
    })
    expect(product).toMatchObject({
      slug: 'oud-real-100ml',
      status: 'PUBLICADO',
      isDemo: false,
      stock: 6,
      brand: { slug: 'casa-prueba', name: 'Casa Prueba' },
    })
    expect(product.searchText).toContain('azafran')
    expect(product.images).toEqual([
      expect.objectContaining({
        url: '/images/products/AR-0001/frente.webp',
        alt: 'Oud Real de Casa Prueba, 100 ml',
      }),
    ])
  })

  it('al volver a importar actualiza sin cambiar la dirección web', async () => {
    await applyCatalog(prisma, validateCatalog(csv(baseRow), photosDir).rows)
    const second = validateCatalog(
      csv({ ...baseRow, nombre: 'Oud Real Edición', inventario: '2' }),
      photosDir,
    )
    expect(await applyCatalog(prisma, second.rows)).toMatchObject({ created: 0, updated: 1 })
    const product = await prisma.product.findUniqueOrThrow({
      where: { sku: 'AR-0001' },
      include: { images: true },
    })
    expect(product).toMatchObject({ slug: 'oud-real-100ml', name: 'Oud Real Edición', stock: 2 })
    expect(product.images).toHaveLength(1)
  })

  it('con retireDemo oculta los productos DEMO', async () => {
    await prisma.product.update({ where: { id: 'p1' }, data: { isDemo: true } })
    const { rows } = validateCatalog(csv(baseRow), photosDir)
    expect(await applyCatalog(prisma, rows, { retireDemo: true })).toMatchObject({
      archivedDemo: 1,
    })
    expect(await prisma.product.findUniqueOrThrow({ where: { id: 'p1' } })).toMatchObject({
      status: 'ARCHIVADO',
    })
  })
})

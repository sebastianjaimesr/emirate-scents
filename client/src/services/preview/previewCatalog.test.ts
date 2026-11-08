/**
 * Pruebas del catálogo de la vista previa (funciona sin servidor).
 */
import { describe, expect, it } from 'vitest'
import { catalogProducts } from '../../../../server/prisma/data/products.catalog'
import { parseCatalogQuery } from '../../features/catalog/catalogQuery'
import * as preview from './previewCatalog'

/** Atajo: convierte un texto de parámetros de URL en un CatalogQuery. */
const query = (search: string, category?: string) =>
  parseCatalogQuery(new URLSearchParams(search), category)

describe('catálogo de la vista previa (sin servidor)', () => {
  it('muestra el catálogo completo (Canva + nuevos), sin productos DEMO', async () => {
    const page = await preview.getProducts(query('pagina=1'))
    expect(page.total).toBe(60)
    expect(page.items.some((product) => product.isDemo)).toBe(false)
  })

  it('la sección Hombre trae lo masculino y lo unisex, sin lo femenino', async () => {
    const all = await preview.getProducts({ ...query('genero=masculino,unisex'), page: 1 })
    const names: string[] = []
    for (let page = 1; page <= all.totalPages; page++) {
      const result = await preview.getProducts({ ...query('genero=masculino,unisex'), page })
      names.push(...result.items.map((product) => product.name))
    }
    expect(names).toEqual(expect.arrayContaining(['Hawas Fire', 'Hawas Ice', 'Art of Universe']))
    expect(names).not.toContain('Yara')
    const arabic = await preview.getProducts(query('genero=femenino,unisex', 'perfumes-arabes'))
    expect(arabic.items.every((product) => product.audience !== 'MASCULINO')).toBe(true)
    expect(arabic.items.every((product) => product.categorySlug === 'perfumes-arabes')).toBe(true)
  })

  it('no repite códigos ni direcciones', () => {
    expect(new Set(catalogProducts.map((product) => product.sku)).size).toBe(60)
    expect(new Set(catalogProducts.map((product) => product.slug)).size).toBe(60)
  })

  it('las equivalencias muestran el nombre completo, pero siempre bajo la Línea Equivalencias', () => {
    const equivalences = catalogProducts.filter((p) => p.categorySlug === 'equivalencias')
    expect(equivalences.length).toBeGreaterThan(0)
    for (const product of equivalences) {
      expect(product.sku).toMatch(/^EQ-/)
      expect(product.name).not.toMatch(/inspirad/i)
      expect(product.inspirationReference).toBe(product.name)
      expect(product.description).toContain('no es el perfume original')
      expect(product.brand.slug).toBe('linea-equivalencias')
    }
  })

  it('cada loción lleva una foto; si una equivalencia usa la del original, queda marcada', () => {
    for (const product of catalogProducts) {
      expect(product.images ?? []).toHaveLength(1)
      const image = product.images?.[0]
      // La foto del perfume de la marca solo como referencia: la ficha lo explica
      if (product.categorySlug === 'equivalencias' && !image?.alt.includes('Emirate Scents'))
        expect(image?.referenceOfOriginal).toBe(true)
    }
  })

  it('busca sin tildes y combina filtros como la API', async () => {
    const page = await preview.getProducts(query('q=CLASICO&orden=precio-asc'))
    expect(page.items.map((product) => product.name)).toEqual(['Asad Clásico'])
    const sorted = await preview.getProducts(query('orden=precio-asc'))
    expect(sorted.items.map((product) => product.price)).toEqual(
      [...sorted.items.map((product) => product.price)].sort((a, b) => a - b),
    )
    const equivalences = await preview.getProducts(query('', 'equivalencias'))
    expect(equivalences.items.every((product) => product.categorySlug === 'equivalencias')).toBe(
      true,
    )
  })

  it('pagina de 12 en 12 y devuelve la última página si se pide una que no existe', async () => {
    const all = await preview.getProducts(query(''))
    const last = await preview.getProducts(query('pagina=999'))
    expect(all.items.length).toBeLessThanOrEqual(12)
    expect(last.page).toBe(all.totalPages)
  })

  it('encuentra productos por dirección y por id', async () => {
    const product = await preview.getProductBySlug('khamrah-lattafa')
    expect(product?.price).toBe(105000)
    expect(await preview.getProductBySlug('no-existe')).toBeNull()
    expect((await preview.getProductsByIds(['retirado', product!.id])).map((p) => p.id)).toEqual([
      product!.id,
    ])
  })
})

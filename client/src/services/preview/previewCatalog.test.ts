import { describe, expect, it } from 'vitest'
import { catalogProducts } from '../../../../server/prisma/data/products.catalog'
import { parseCatalogQuery } from '../../features/catalog/catalogQuery'
import * as preview from './previewCatalog'

const query = (search: string, category?: string) =>
  parseCatalogQuery(new URLSearchParams(search), category)

describe('catálogo de la vista previa (sin servidor)', () => {
  it('muestra el catálogo del Canva completo, sin productos DEMO', async () => {
    const page = await preview.getProducts(query('pagina=1'))
    expect(page.total).toBe(57)
    expect(page.items.some((product) => product.isDemo)).toBe(false)
  })

  it('no repite códigos ni direcciones', () => {
    expect(new Set(catalogProducts.map((product) => product.sku)).size).toBe(57)
    expect(new Set(catalogProducts.map((product) => product.slug)).size).toBe(57)
  })

  it('las equivalencias nunca llevan la marca que evocan', () => {
    const equivalences = catalogProducts.filter((p) => p.categorySlug === 'equivalencias')
    expect(equivalences.length).toBeGreaterThan(0)
    for (const product of equivalences) {
      expect(product.sku).toMatch(/^EQ-/)
      expect(product.name).toMatch(/^Inspirado en /)
      expect(product.inspirationReference).toBeTruthy()
      expect(product.brand.slug).toBe('linea-equivalencias')
    }
  })

  it('las lociones árabes llevan su foto y las equivalencias ninguna', () => {
    for (const product of catalogProducts) {
      const expected = product.categorySlug === 'equivalencias' ? 0 : 1
      expect(product.images ?? []).toHaveLength(expected)
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

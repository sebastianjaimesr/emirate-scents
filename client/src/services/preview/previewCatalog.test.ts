import { describe, expect, it } from 'vitest'
import { parseCatalogQuery } from '../../features/catalog/catalogQuery'
import * as preview from './previewCatalog'

const query = (search: string, category?: string) =>
  parseCatalogQuery(new URLSearchParams(search), category)

describe('catálogo de la vista previa (sin servidor)', () => {
  it('solo contiene productos DEMO', async () => {
    const page = await preview.getProducts(query('pagina=1'))
    expect(page.total).toBeGreaterThan(0)
    expect(page.items.every((product) => product.isDemo)).toBe(true)
  })

  it('busca sin tildes y combina filtros como la API', async () => {
    const page = await preview.getProducts(query('q=AMBAR&orden=precio-asc'))
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.map((product) => product.price)).toEqual(
      [...page.items.map((product) => product.price)].sort((a, b) => a - b),
    )
    const nicho = await preview.getProducts(query('', 'nicho'))
    expect(nicho.items.every((product) => product.categorySlug === 'nicho')).toBe(true)
  })

  it('pagina de 12 en 12 y devuelve la última página si se pide una que no existe', async () => {
    const all = await preview.getProducts(query(''))
    const last = await preview.getProducts(query('pagina=999'))
    expect(all.items.length).toBeLessThanOrEqual(12)
    expect(last.page).toBe(all.totalPages)
  })

  it('encuentra productos por dirección y por id', async () => {
    const product = await preview.getProductBySlug('demo-oud-nocturno')
    expect(product?.name).toBe('Oud Nocturno')
    expect(await preview.getProductBySlug('no-existe')).toBeNull()
    expect((await preview.getProductsByIds(['retirado', product!.id])).map((p) => p.id)).toEqual([
      product!.id,
    ])
  })
})

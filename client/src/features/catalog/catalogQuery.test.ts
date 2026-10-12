import { describe, expect, it } from 'vitest'
import type { Product } from '../../types/product'
import {
  applyCatalogQuery,
  getCatalogFacets,
  parseCatalogQuery,
  toSearchParams,
} from './catalogQuery'

function product(overrides: Partial<Product> & Pick<Product, 'sku' | 'name' | 'price'>): Product {
  return {
    id: overrides.sku,
    slug: overrides.sku.toLowerCase(),
    brand: { slug: 'marca-a', name: 'Marca A' },
    categorySlug: 'perfumes-arabes',
    shortDescription: '',
    description: '',
    images: [],
    stock: 1,
    publishedAt: '2026-01-01',
    isDemo: true,
    ...overrides,
  }
}

const products = [
  product({
    sku: 'AR-1',
    name: 'Ámbar Real',
    price: 200000,
    sizeMl: 100,
    olfactoryFamily: 'Oriental',
    publishedAt: '2026-03-01',
  }),
  product({
    sku: 'AR-2',
    name: 'Oud Rosa',
    price: 300000,
    sizeMl: 50,
    olfactoryFamily: 'Amaderada',
    isFeatured: true,
    notes: { top: [], heart: ['Rosa'], base: ['Oud'] },
  }),
  product({
    sku: 'NI-1',
    name: 'Cuero',
    price: 700000,
    sizeMl: 100,
    categorySlug: 'nicho',
    brand: { slug: 'marca-b', name: 'Marca B' },
    publishedAt: '2026-05-01',
  }),
]

const parse = (search: string, category?: string) =>
  parseCatalogQuery(new URLSearchParams(search), category)

describe('parseCatalogQuery / toSearchParams', () => {
  it('lee filtros válidos de la URL', () => {
    const query = parse(
      'q=oud&marca=marca-a,marca-b&tamano=50,100&precioMin=100000&orden=precio-asc&pagina=2',
    )
    expect(query).toMatchObject({
      search: 'oud',
      brands: ['marca-a', 'marca-b'],
      sizes: [50, 100],
      minPrice: 100000,
      sort: 'precio-asc',
      page: 2,
    })
  })

  it('ignora valores inválidos en lugar de fallar', () => {
    const query = parse('tamano=abc,-5&precioMin=-1&orden=hackeo&pagina=0')
    expect(query.sizes).toEqual([])
    expect(query.minPrice).toBeUndefined()
    expect(query.sort).toBe('destacados')
    expect(query.page).toBe(1)
  })

  it('genera la URL sin los valores por defecto', () => {
    expect(toSearchParams(parse('orden=destacados&pagina=1')).toString()).toBe('')
    expect(toSearchParams(parse('marca=marca-a&orden=nombre')).toString()).toBe(
      'marca=marca-a&orden=nombre',
    )
  })
})

describe('applyCatalogQuery', () => {
  it('filtra por categoría', () => {
    expect(applyCatalogQuery(products, parse('', 'nicho')).items.map((p) => p.sku)).toEqual([
      'NI-1',
    ])
  })

  it('busca sin importar tildes ni mayúsculas, también en las notas', () => {
    expect(applyCatalogQuery(products, parse('q=AMBAR')).items.map((p) => p.sku)).toEqual(['AR-1'])
    expect(applyCatalogQuery(products, parse('q=rosa oud')).items.map((p) => p.sku)).toEqual([
      'AR-2',
    ])
  })

  it('combina marca, tamaño, familia y rango de precio', () => {
    const result = applyCatalogQuery(
      products,
      parse('marca=marca-a&tamano=100&familia=Oriental&precioMax=250000'),
    )
    expect(result.items.map((p) => p.sku)).toEqual(['AR-1'])
  })

  it('ordena por precio, nombre, novedades y destacados', () => {
    const skus = (search: string) =>
      applyCatalogQuery(products, parse(search)).items.map((p) => p.sku)
    expect(skus('orden=precio-asc')).toEqual(['AR-1', 'AR-2', 'NI-1'])
    expect(skus('orden=precio-desc')).toEqual(['NI-1', 'AR-2', 'AR-1'])
    expect(skus('orden=nombre')).toEqual(['AR-1', 'NI-1', 'AR-2'])
    expect(skus('orden=novedades')).toEqual(['NI-1', 'AR-1', 'AR-2'])
    expect(skus('')[0]).toBe('AR-2')
  })

  it('pagina los resultados y corrige páginas fuera de rango', () => {
    const result = applyCatalogQuery(products, parse('orden=precio-asc&pagina=9'), 2)
    expect(result).toMatchObject({ total: 3, totalPages: 2, page: 2 })
    expect(result.items.map((p) => p.sku)).toEqual(['NI-1'])
  })
})

describe('getCatalogFacets', () => {
  it('calcula marcas, tamaños, familias y rango de precios de la categoría', () => {
    const facets = getCatalogFacets(products, 'perfumes-arabes')
    expect(facets.brands).toEqual([{ slug: 'marca-a', name: 'Marca A', count: 2 }])
    expect(facets.sizes).toEqual([
      { value: 50, count: 1 },
      { value: 100, count: 1 },
    ])
    expect(facets.priceRange).toEqual({ min: 200000, max: 300000 })
  })
})

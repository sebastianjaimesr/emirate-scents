/**
 * Pruebas de la lectura y escritura de los filtros del catálogo en la URL.
 */
import { describe, expect, it } from 'vitest'
import { parseCatalogQuery, toSearchParams } from './catalogQuery'

/** Atajo: convierte un texto de parámetros de URL en un CatalogQuery. */
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

  it('descarta marcas con formato inválido y corrige un rango de precios invertido', () => {
    const query = parse('marca=marca-a,<script>,Marca B&precioMin=500&precioMax=100')
    expect(query.brands).toEqual(['marca-a'])
    expect(query).toMatchObject({ minPrice: 100, maxPrice: 500 })
  })

  it('genera la URL sin los valores por defecto', () => {
    expect(toSearchParams(parse('orden=destacados&pagina=1')).toString()).toBe('')
    expect(toSearchParams(parse('marca=marca-a&orden=nombre')).toString()).toBe(
      'marca=marca-a&orden=nombre',
    )
  })
  it('lee género y colección, y descarta valores desconocidos', () => {
    const query = parse('genero=masculino,nino,unisex&coleccion=ofertas')
    expect(query.audiences).toEqual(['masculino', 'unisex'])
    expect(query.collection).toBe('ofertas')
    expect(parse('coleccion=gratis').collection).toBeUndefined()
    expect(toSearchParams(query).toString()).toBe('genero=masculino%2Cunisex&coleccion=ofertas')
  })

  it('al buscar ordena por relevancia por defecto; sin búsqueda, relevancia no aplica', () => {
    expect(parse('q=khamrah').sort).toBe('relevancia')
    expect(toSearchParams(parse('q=khamrah')).toString()).toBe('q=khamrah')
    expect(parse('q=khamrah&orden=precio-asc').sort).toBe('precio-asc')
    expect(parse('orden=relevancia').sort).toBe('destacados')
  })
})

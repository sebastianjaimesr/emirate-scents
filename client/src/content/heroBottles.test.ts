import { describe, expect, it } from 'vitest'
import { catalogProducts } from '../../../server/prisma/data/products.catalog'
import heroBottles from './hero-bottles.json'

const heroFiles = Object.keys(import.meta.glob('../../public/images/hero/*')).map((file) =>
  file.split('/').pop(),
)

/* La portada solo puede mostrar perfumes reales del catálogo, y nunca equivalencias. */
describe('perfumes de la portada', () => {
  it.each(heroBottles)('$name está en el catálogo, es original y tiene sus fotos', (bottle) => {
    const product = catalogProducts.find((entry) => entry.sku === bottle.sku)
    expect(product?.name).toBe(bottle.name)
    expect(product?.brand.name).toBe(bottle.brand)
    expect(product?.categorySlug).not.toBe('equivalencias')
    for (const size of ['480', '800'])
      for (const format of ['avif', 'webp'])
        expect(heroFiles).toContain(`${bottle.key}-${size}.${format}`)
  })
})

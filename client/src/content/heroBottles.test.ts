import { describe, expect, it } from 'vitest'
import { catalogProducts } from '../../../server/prisma/data/products.catalog'
import heroBottles from './hero-bottles.json'

import heroImages from './hero-images.json'

const heroFiles = Object.keys(import.meta.glob('../../public/images/hero/*')).map((file) =>
  file.split('/').pop(),
)

/* La portada solo puede mostrar perfumes reales del catálogo, y nunca equivalencias. */
describe('perfumes de la portada', () => {
  it.each(heroBottles)('$name está en el catálogo, es original y tiene sus fotos', (bottle) => {
    const product = catalogProducts.find((entry) => entry.sku === bottle.sku)
    expect(product?.name).toBe(bottle.name)
    expect(product?.slug).toBe(bottle.slug)
    expect(product?.brand.name).toBe(bottle.brand)
    expect(product?.categorySlug).not.toBe('equivalencias')
    for (const size of ['480', '800'])
      for (const format of ['avif', 'webp'])
        expect(heroFiles).toContain(`${bottle.key}-${size}.${format}`)
    // Medidas reales anotadas por `npm run fotos:portada` (reservan el espacio de la foto)
    expect(heroImages).toHaveProperty(bottle.key)
  })
})

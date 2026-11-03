/// <reference types="node" />
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { catalogProducts } from '../../../../server/prisma/data/products.catalog'

/** Carpeta client/public: las fotos del catálogo se publican con la tienda. */
const publicDir = fileURLToPath(new URL('../../../public', import.meta.url))
const fileOf = (url: string) => path.join(publicDir, url)

const images = catalogProducts.map((product) => ({ product, image: product.images?.[0] }))

describe('fotos del catálogo', () => {
  it('todas las fotos y sus copias de otros tamaños existen (ninguna imagen rota)', () => {
    for (const { product, image } of images) {
      expect(image, product.sku).toBeDefined()
      expect(existsSync(fileOf(image!.url)), image!.url).toBe(true)
      const copies = image!.srcSet?.split(',').map((entry) => entry.trim().split(/\s+/)) ?? []
      expect(copies.length, `${product.sku}: copias 400 y 800 como mínimo`).toBeGreaterThan(1)
      for (const [url, width] of copies) {
        expect(width).toMatch(/^\d+w$/)
        expect(existsSync(fileOf(url!)), url).toBe(true)
      }
    }
  })

  it('ningún producto repite la foto de otro', () => {
    const hashes = new Map<string, string>()
    for (const { product, image } of images) {
      const hash = createHash('sha256')
        .update(readFileSync(fileOf(image!.url)))
        .digest('hex')
      expect(hashes.get(hash), `${product.sku} repite la foto de ${hashes.get(hash)}`).toBe(
        undefined,
      )
      hashes.set(hash, product.sku)
    }
  })

  it('las ilustraciones de las equivalencias se marcan como "imagen ilustrativa"', () => {
    for (const { product, image } of images) {
      const isEquivalence = product.categorySlug === 'equivalencias'
      // Mientras no haya foto propia del frasco, la equivalencia lleva la ilustración
      if (isEquivalence && image?.alt.startsWith('Ilustración'))
        expect(image.illustrative).toBe(true)
      if (!isEquivalence) expect(image?.illustrative).toBeFalsy()
    }
  })
})

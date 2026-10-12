import { describe, expect, it } from 'vitest'
import type { Product } from '../../types/product'
import {
  addItem,
  buildCartLines,
  clampQuantity,
  countItems,
  MAX_QUANTITY_PER_ITEM,
  removeItem,
  setItemQuantity,
} from './cartItems'

const product = (id: string, price: number, stock: number): Product => ({
  id,
  sku: id,
  slug: id,
  name: id,
  brand: { slug: 'b', name: 'B' },
  categorySlug: 'nicho',
  shortDescription: '',
  description: '',
  price,
  images: [],
  stock,
  publishedAt: '2026-01-01',
  isDemo: false,
})

describe('clampQuantity', () => {
  it('mantiene la cantidad entre 1 y el máximo/inventario', () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-4)).toBe(1)
    expect(clampQuantity(2.7)).toBe(2)
    expect(clampQuantity(99)).toBe(MAX_QUANTITY_PER_ITEM)
    expect(clampQuantity(5, 3)).toBe(3)
    expect(clampQuantity(Number.NaN)).toBe(1)
  })
})

describe('operaciones del carrito', () => {
  it('agrega, acumula sin pasar del inventario, cambia cantidad y elimina', () => {
    let items = addItem([], 'a', 2, 5)
    items = addItem(items, 'a', 10, 5)
    expect(items).toEqual([{ productId: 'a', quantity: 5 }])
    items = addItem(items, 'b', 1)
    expect(countItems(items)).toBe(6)
    items = setItemQuantity(items, 'b', 3)
    expect(items[1].quantity).toBe(3)
    items = setItemQuantity(items, 'b', 0)
    expect(items.map((item) => item.productId)).toEqual(['a'])
    expect(removeItem(items, 'a')).toEqual([])
  })

  it('no agrega productos agotados', () => {
    expect(addItem([], 'a', 1, 0)).toEqual([])
  })
})

describe('buildCartLines', () => {
  it('calcula líneas y subtotal exacto con precios del catálogo', () => {
    const result = buildCartLines(
      [
        { productId: 'a', quantity: 2 },
        { productId: 'b', quantity: 1 },
      ],
      [product('a', 285000, 10), product('b', 72000, 10)],
    )
    expect(result.lines.map((line) => line.lineTotal)).toEqual([570000, 72000])
    expect(result.subtotal).toBe(642000)
  })

  it('descarta productos inexistentes, marca agotados y reduce cantidades', () => {
    const result = buildCartLines(
      [
        { productId: 'borrado', quantity: 1 },
        { productId: 'agotado', quantity: 1 },
        { productId: 'escaso', quantity: 5 },
      ],
      [product('agotado', 100000, 0), product('escaso', 50000, 2)],
    )
    expect(result.lines.map((line) => [line.product.id, line.status, line.quantity])).toEqual([
      ['agotado', 'sold-out', 0],
      ['escaso', 'reduced', 2],
    ])
    expect(result.subtotal).toBe(100000)
    expect(result.hasSoldOut).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { emptyProduct, parsePesos, slugify, toPayload } from './productForm'

describe('formulario de producto', () => {
  it('convierte precios escritos con puntos o signo de pesos', () => {
    expect(parsePesos('285.000')).toBe(285000)
    expect(parsePesos('$ 285000')).toBe(285000)
    expect(parsePesos('')).toBeNull()
    expect(parsePesos('abc')).toBeNaN()
  })

  it('crea la dirección del producto sin tildes ni símbolos', () => {
    expect(slugify('Ámbar Real · 100 ml')).toBe('ambar-real-100-ml')
    expect(slugify('  Oud & Rosa  ')).toBe('oud-rosa')
  })

  it('arma lo que se envía al servidor: listas, vacíos como null y stock inicial solo al crear', () => {
    const values = {
      ...emptyProduct,
      name: 'Oud',
      price: '280.000',
      notesTop: 'Azafrán, Bergamota;  Rosa ',
      olfactoryFamily: '  ',
      initialStock: '5',
    }
    expect(toPayload(values, true)).toMatchObject({
      price: 280000,
      compareAtPrice: null,
      sizeMl: null,
      notesTop: ['Azafrán', 'Bergamota', 'Rosa'],
      olfactoryFamily: null,
      concentration: null,
      initialStock: 5,
    })
    expect(toPayload(values, false)).not.toHaveProperty('initialStock')
  })
})

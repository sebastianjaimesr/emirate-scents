import { describe, expect, it } from 'vitest'
import { pickPoints, splitName } from './textPoints'

describe('splitName', () => {
  it('deja los nombres cortos en una línea', () => {
    expect(splitName('Oud Nocturno')).toEqual(['Oud Nocturno'])
    expect(splitName('Supercalifragilístico')).toEqual(['Supercalifragilístico'])
  })

  it('corta los nombres largos en el espacio más cercano a la mitad', () => {
    expect(splitName('Equivalencia Floral Dulce')).toEqual(['Equivalencia', 'Floral Dulce'])
    expect(splitName('Especias  de   Zanzíbar')).toEqual(['Especias de', 'Zanzíbar'])
  })
})

describe('pickPoints', () => {
  // Imagen de 10 × 4 con "letra" solo en la columna x = 7, filas 1 y 2
  const alpha = (index: number) =>
    index % 10 === 7 && [1, 2].includes(Math.floor(index / 10)) ? 255 : 0

  it('pone todos los puntos dentro de las letras, centrados en 0', () => {
    const points = pickPoints(alpha, 10, 4, 50)
    expect(points).toHaveLength(100)
    for (let i = 0; i < 50; i++) {
      const x = points[i * 2]
      const y = points[i * 2 + 1]
      expect(x).toBeGreaterThanOrEqual(0.7 - 0.5)
      expect(x).toBeLessThan(0.8 - 0.5)
      // Filas 1 y 2 de 4: cerca del centro vertical, en unidades del ancho
      expect(Math.abs(y)).toBeLessThanOrEqual(0.1)
    }
  })

  it('no falla si no hay letras', () => {
    const points = pickPoints(() => 0, 10, 4, 5)
    expect(points.every((value) => Number.isFinite(value))).toBe(true)
  })
})

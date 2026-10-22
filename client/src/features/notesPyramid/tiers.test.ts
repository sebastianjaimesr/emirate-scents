import { describe, expect, it } from 'vitest'
import { noteAngles, tiers } from './tiers'

describe('pirámide olfativa', () => {
  it('tiene salida, corazón y fondo, en ese orden', () => {
    expect(tiers.map((tier) => tier.key)).toEqual(['top', 'heart', 'base'])
  })

  it('reparte las notas de un piso con el mismo espacio entre ellas', () => {
    const angles = noteAngles(4, 0)
    expect(angles).toHaveLength(4)
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i] - angles[i - 1]).toBeCloseTo(Math.PI / 2)
    }
    expect(noteAngles(0, 1)).toEqual([])
  })

  it('empieza cada piso en un ángulo distinto', () => {
    expect(noteAngles(3, 0)[0]).not.toBe(noteAngles(3, 1)[0])
  })
})

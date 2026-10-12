import { describe, expect, it } from 'vitest'
import { formatCOP } from './formatCOP'

// Intl usa un espacio de no separación entre "$" y el número; lo normalizamos para comparar
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('formatCOP', () => {
  it('usa punto como separador de miles y no muestra decimales', () => {
    expect(normalize(formatCOP(285000))).toBe('$ 285.000')
    expect(normalize(formatCOP(1250000))).toBe('$ 1.250.000')
  })

  it('redondea valores con decimales', () => {
    expect(normalize(formatCOP(99999.6))).toBe('$ 100.000')
  })
})

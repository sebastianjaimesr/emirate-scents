import { describe, expect, it } from 'vitest'
import { BRAND_GOLD, familyColor } from './familyPalette'

describe('familyColor', () => {
  it('reconoce la familia aunque cambien las tildes o las mayúsculas', () => {
    expect(familyColor('Cítrica')).toBe(familyColor('citrica'))
    expect(familyColor('  AMADERADA ')).toBe(familyColor('Amaderada'))
  })

  it('usa el dorado de la marca si la familia no se conoce o falta', () => {
    expect(familyColor('Inventada')).toBe(BRAND_GOLD)
    expect(familyColor(undefined)).toBe(BRAND_GOLD)
  })
})

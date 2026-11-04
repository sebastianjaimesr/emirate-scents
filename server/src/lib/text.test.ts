/**
 * Pruebas de la normalización de textos para búsqueda.
 */
import { describe, expect, it } from 'vitest'
import { buildSearchText, normalizeText, searchWords } from './text.js'

describe('normalizeText', () => {
  it('quita tildes, mayúsculas y signos', () => {
    expect(normalizeText('  Ámbar   ROSA de Taïf! ')).toBe('ambar rosa de taif')
    expect(normalizeText('Eñe 100% d’Issey_x')).toBe('ene 100 d issey x')
  })
})

describe('searchWords', () => {
  it('separa en palabras normalizadas y descarta vacíos', () => {
    expect(searchWords('Oud  ROSA')).toEqual(['oud', 'rosa'])
    expect(searchWords('  %_ ')).toEqual([])
  })
})

describe('buildSearchText', () => {
  it('une nombre, marca, familia y notas', () => {
    expect(
      buildSearchText({
        name: 'Oud Nocturno',
        brandName: 'Casa Noor',
        olfactoryFamily: 'Amaderada',
        notesTop: ['Azafrán'],
        notesBase: ['Ámbar'],
      }),
    ).toBe('oud nocturno casa noor amaderada azafran ambar')
  })
})

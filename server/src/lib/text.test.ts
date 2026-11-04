/**
 * Pruebas de la normalización de textos para búsqueda.
 */
import { describe, expect, it } from 'vitest'
import { buildSearchText, normalizeText, relevanceScore, searchWords } from './text.js'

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

describe('relevanceScore', () => {
  const score = (name: string, search: string, brandName = 'Lattafa') =>
    relevanceScore({ name, brandName }, searchWords(search))

  it('pone primero el nombre exacto, luego el que empieza igual y luego el que lo contiene', () => {
    expect(score('Khamrah', 'khamrah')).toBeGreaterThan(score('Khamrah Dukhan', 'khamrah'))
    expect(score('Khamrah Dukhan', 'khamrah')).toBeGreaterThan(score('Oud Khamrah', 'khamrah'))
  })

  it('la marca suma menos que el nombre y sin búsqueda no hay puntaje', () => {
    expect(score('Asad', 'asad', 'Otra')).toBeGreaterThan(score('Yara', 'lattafa'))
    expect(score('Asad', '')).toBe(0)
  })
})

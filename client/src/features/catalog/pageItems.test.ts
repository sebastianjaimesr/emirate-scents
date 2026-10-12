import { describe, expect, it } from 'vitest'
import { getPageItems } from './pageItems'

describe('getPageItems', () => {
  it('muestra todas las páginas cuando son pocas', () => {
    expect(getPageItems(2, 3)).toEqual([1, 2, 3])
  })

  it('resume con puntos suspensivos cuando son muchas', () => {
    expect(getPageItems(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10])
    expect(getPageItems(1, 10)).toEqual([1, 2, '…', 10])
    expect(getPageItems(10, 10)).toEqual([1, '…', 9, 10])
  })
})

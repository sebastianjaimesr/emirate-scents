import { afterEach, describe, expect, it, vi } from 'vitest'
import { mediaUrl } from './mediaUrl'

afterEach(() => vi.unstubAllEnvs())

describe('mediaUrl', () => {
  it('deja igual las direcciones relativas cuando todo está en el mismo dominio', () => {
    expect(mediaUrl('/uploads/products/p1/a-960.webp')).toBe('/uploads/products/p1/a-960.webp')
    expect(mediaUrl('/images/products/oud.webp')).toBe('/images/products/oud.webp')
  })

  it('en GitHub Pages pide las fotos subidas a la API y las propias a la subcarpeta', () => {
    vi.stubEnv('VITE_API_URL', 'https://emirate.up.railway.app/api')
    vi.stubEnv('BASE_URL', '/emirate-scents/')
    expect(mediaUrl('/uploads/products/p1/a-960.webp')).toBe(
      'https://emirate.up.railway.app/uploads/products/p1/a-960.webp',
    )
    expect(mediaUrl('/images/products/oud.webp')).toBe('/emirate-scents/images/products/oud.webp')
  })

  it('no toca direcciones completas', () => {
    vi.stubEnv('VITE_API_URL', 'https://emirate.up.railway.app/api')
    expect(mediaUrl('https://cdn.ejemplo.com/foto.webp')).toBe('https://cdn.ejemplo.com/foto.webp')
  })
})

import { describe, expect, it } from 'vitest'
import { parseEnv } from '../src/config/env.js'

/* Reglas de las variables de entorno: el servidor no arranca con una configuración peligrosa. */

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@db:5432/emirate',
  PUBLIC_URL: 'https://sebastianjaimesr.github.io/emirate-scents',
  CORS_ORIGIN: 'https://sebastianjaimesr.github.io',
  ADMIN_ORIGIN: 'https://emirate.up.railway.app',
  SERVE_CLIENT: 'true',
  ADMIN_ONLY: 'true',
  TRUST_PROXY: '1',
}

describe('variables de entorno', () => {
  it('acepta la configuración de producción con la tienda en GitHub Pages', () => {
    const env = parseEnv(production)
    expect(env).toMatchObject({
      ADMIN_ONLY: true,
      CORS_ORIGIN: ['https://sebastianjaimesr.github.io'],
      ADMIN_ORIGIN: ['https://emirate.up.railway.app'],
    })
  })

  it('rechaza orígenes con ruta: el navegador nunca los enviaría así', () => {
    expect(() =>
      parseEnv({ ...production, CORS_ORIGIN: 'https://sebastianjaimesr.github.io/emirate-scents' }),
    ).toThrow(/CORS_ORIGIN.*no es un origen válido/)
  })

  it('en producción exige https y no deja los valores de desarrollo por defecto', () => {
    expect(() =>
      parseEnv({ ...production, ADMIN_ORIGIN: 'http://emirate.up.railway.app' }),
    ).toThrow(/ADMIN_ORIGIN debe usar https/)
    const { CORS_ORIGIN: _cors, ADMIN_ORIGIN: _admin, ...withoutOrigins } = production
    expect(() => parseEnv(withoutOrigins)).toThrow(/CORS_ORIGIN debe usar https[\s\S]*ADMIN_ORIGIN/)
  })

  it('ADMIN_ONLY necesita servir el panel y saber adónde redirigir la tienda', () => {
    expect(() => parseEnv({ ...production, SERVE_CLIENT: 'false' })).toThrow(/ADMIN_ONLY/)
  })

  it('el servidor publicado no arranca si falta NODE_ENV=production (la cookie sería insegura)', () => {
    const { NODE_ENV: _nodeEnv, ...withoutNodeEnv } = production
    expect(() => parseEnv(withoutNodeEnv)).toThrow(/NODE_ENV debe ser production/)
  })

  it('en desarrollo funciona sin configurar orígenes', () => {
    const env = parseEnv({ DATABASE_URL: 'postgresql://localhost/emirate' })
    expect(env.ADMIN_ONLY).toBe(false)
    expect(env.CORS_ORIGIN).toEqual(['http://localhost:5173'])
  })
})

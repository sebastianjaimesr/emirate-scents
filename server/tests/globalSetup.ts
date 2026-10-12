import { execSync } from 'node:child_process'

/**
 * Antes de las pruebas: aplica las migraciones pendientes a la base de datos de pruebas.
 * (Cada archivo de pruebas carga después sus propios datos; ver fixtures.ts.)
 */
export default function setup() {
  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) {
    throw new Error(
      'Falta TEST_DATABASE_URL en server/.env: las pruebas necesitan su propia base de datos (ver server/.env.example).',
    )
  }
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL no puede ser la misma que DATABASE_URL: las pruebas borran sus datos.',
    )
  }
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  })
}

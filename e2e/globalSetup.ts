import { execSync } from 'node:child_process'

/**
 * Antes de las pruebas: prepara la base de datos de PRUEBAS con migraciones y datos propios
 * (server/tests/e2eSeed.ts). Se niega a continuar si apunta a la base de datos de desarrollo.
 */
export default function globalSetup() {
  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) {
    throw new Error('Falta TEST_DATABASE_URL en server/.env (ver server/.env.example).')
  }
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL no puede ser la misma que DATABASE_URL.')
  }
  const options = {
    cwd: 'server',
    env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' },
    stdio: 'pipe' as const,
  }
  execSync('npx prisma migrate deploy', options)
  execSync('npx tsx tests/e2eSeed.ts', options)
}

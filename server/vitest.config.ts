import 'dotenv/config'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

/*
  Las pruebas de la API usan una base de datos PROPIA (TEST_DATABASE_URL), cuyos productos
  se borran y se vuelven a crear en cada ejecución. Nunca tocan la base de datos de desarrollo.
*/
const testDatabaseUrl = process.env.TEST_DATABASE_URL

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      // Las fotos subidas en las pruebas van a una carpeta temporal, nunca a uploads/
      UPLOADS_DIR: path.join(tmpdir(), 'emirate-scents-test-uploads'),
      ADMIN_ORIGIN: 'http://panel.test',
      ...(testDatabaseUrl && { DATABASE_URL: testDatabaseUrl }),
    },
    globalSetup: ['tests/globalSetup.ts'],
    // Todas las pruebas comparten la base de datos de pruebas: se ejecutan de una en una
    fileParallelism: false,
  },
})

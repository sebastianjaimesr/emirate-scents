import 'dotenv/config'
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
      ...(testDatabaseUrl && { DATABASE_URL: testDatabaseUrl }),
    },
    globalSetup: ['tests/globalSetup.ts'],
    // Todas las pruebas comparten la base de datos de pruebas: se ejecutan de una en una
    fileParallelism: false,
  },
})

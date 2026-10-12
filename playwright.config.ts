import { defineConfig, devices } from '@playwright/test'

/*
  Pruebas de punta a punta: un navegador real recorre la tienda como lo haría un cliente.
  Usan la API conectada a la base de datos de PRUEBAS (TEST_DATABASE_URL de server/.env),
  nunca la de desarrollo. Antes de ejecutarlas: `npm run build`.
*/
process.loadEnvFile?.('server/.env')

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? ''
const API_PORT = 4100
const STORE_PORT = 4174

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/globalSetup.ts',
  // Todas las pruebas comparten la misma base de datos: una a la vez
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/informe' }]],
  outputDir: 'e2e/resultados',
  use: {
    baseURL: `http://localhost:${STORE_PORT}`,
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // En algunos equipos el navegador ya está instalado en otra ruta
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run start --workspace server',
      url: `http://localhost:${API_PORT}/api/health`,
      env: {
        DATABASE_URL: testDatabaseUrl,
        PORT: String(API_PORT),
        NODE_ENV: 'test',
        CORS_ORIGIN: `http://localhost:${STORE_PORT}`,
      },
      reuseExistingServer: false,
    },
    {
      command: `npm run preview --workspace client -- --port ${STORE_PORT} --strictPort`,
      url: `http://localhost:${STORE_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
})

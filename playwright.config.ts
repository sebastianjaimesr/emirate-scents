import { tmpdir } from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/*
  Pruebas de punta a punta: un navegador real recorre la tienda como lo haría un cliente.
  Usan la API conectada a la base de datos de PRUEBAS (TEST_DATABASE_URL de server/.env),
  nunca la de desarrollo. Antes de ejecutarlas: `npm run build`.
*/
process.loadEnvFile?.('server/.env')

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? ''
const PORT = 4100

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
    baseURL: `http://localhost:${PORT}`,
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
  // Igual que en producción: la API sirve también la tienda compilada (SERVE_CLIENT)
  webServer: {
    command: 'npm run start --workspace server',
    url: `http://localhost:${PORT}/api/health`,
    env: {
      DATABASE_URL: testDatabaseUrl,
      PORT: String(PORT),
      NODE_ENV: 'test',
      SERVE_CLIENT: 'true',
      PUBLIC_URL: `http://localhost:${PORT}`,
      // El panel se usa desde la misma dirección de las pruebas
      ADMIN_ORIGIN: `http://localhost:${PORT}`,
      // Fotos subidas en las pruebas: carpeta temporal, nunca server/uploads
      UPLOADS_DIR: path.join(tmpdir(), 'emirate-scents-e2e-uploads'),
    },
    reuseExistingServer: false,
  },
})

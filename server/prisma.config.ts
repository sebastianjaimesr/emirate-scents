import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/** Configuración de Prisma: dónde están el esquema, las migraciones y la semilla. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Sin DATABASE_URL (por ejemplo, en `npm install` recién clonado) aún se puede generar
  // el cliente; los comandos de migración avisarán de que falta la conexión.
  ...(process.env.DATABASE_URL && { datasource: { url: process.env.DATABASE_URL } }),
})

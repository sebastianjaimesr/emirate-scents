import { z } from 'zod'

/**
 * Variables de entorno validadas al arrancar. Si falta alguna o tiene un formato
 * incorrecto, el servidor no arranca y explica qué corregir, en lugar de fallar
 * más tarde con un error difícil de entender.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z
      .string({ error: 'Falta DATABASE_URL (copia server/.env.example como server/.env)' })
      .startsWith('postgresql://', 'DATABASE_URL debe empezar por postgresql://'),
    // Cuántos proxies hay delante de la API en producción (el hosting suele poner 1).
    // Con 0, la API ignora la cabecera X-Forwarded-For, que cualquiera podría falsificar.
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    // En producción la misma app sirve la tienda (client/dist) y la API: un solo servicio
    SERVE_CLIENT: z.stringbool().default(false),
    // Dirección pública de la tienda, sin "/" al final (para el mapa del sitio de Google)
    PUBLIC_URL: z
      .url({
        protocol: /^https?$/,
        error: 'PUBLIC_URL debe ser una dirección como https://tudominio.com',
      })
      .transform((value) => value.replace(/\/+$/, ''))
      .optional(),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.PUBLIC_URL, {
    path: ['PUBLIC_URL'],
    error: 'En producción falta PUBLIC_URL (la dirección pública de la tienda)',
  })

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Configuración inválida en las variables de entorno:\n${problems}`)
  }
  return result.data
}

export const env = loadEnv()

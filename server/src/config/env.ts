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
    // Dirección (origen) desde la que se usa el panel /admin, separadas por comas. El panel
    // solo acepta cambios que lleguen desde aquí (protección contra peticiones falsificadas).
    // En producción: la dirección del servicio en Railway, por ejemplo https://xxx.up.railway.app
    ADMIN_ORIGIN: z
      .string()
      .default('http://localhost:5173,http://localhost:4000')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean),
      ),
    // Carpeta donde se guardan las fotos subidas desde el panel. En Railway, dentro de un
    // volumen (por ejemplo /data/uploads): si no, las fotos se pierden en cada publicación
    UPLOADS_DIR: z.string().min(1).default('uploads'),
    // true cuando la tienda se publica en otro sitio (GitHub Pages): este servidor solo
    // atiende la API, el panel y las fotos, y las páginas de la tienda redirigen a PUBLIC_URL
    ADMIN_ONLY: z.stringbool().default(false),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.PUBLIC_URL, {
    path: ['PUBLIC_URL'],
    error: 'En producción falta PUBLIC_URL (la dirección pública de la tienda)',
  })
  // ADMIN_ONLY solo se usa en el servidor publicado. Sin NODE_ENV=production la cookie del
  // panel no llevaría Secure ni __Host-: mejor no arrancar que arrancar inseguro
  .refine((env) => !env.ADMIN_ONLY || env.NODE_ENV === 'production', {
    path: ['NODE_ENV'],
    error: 'Con ADMIN_ONLY=true, NODE_ENV debe ser production',
  })
  .refine((env) => !env.ADMIN_ONLY || (env.SERVE_CLIENT && env.PUBLIC_URL), {
    path: ['ADMIN_ONLY'],
    error: 'ADMIN_ONLY=true necesita SERVE_CLIENT=true (el panel) y PUBLIC_URL (adónde redirigir)',
  })
  // Un origen es solo protocolo + dominio (+ puerto): https://tienda.com, sin ruta ni "/" final.
  // Con una ruta (…github.io/emirate-scents) el navegador nunca coincide y todo falla en silencio
  .superRefine((env, ctx) => {
    for (const key of ['CORS_ORIGIN', 'ADMIN_ORIGIN'] as const) {
      for (const origin of env[key]) {
        if (!isOrigin(origin)) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `"${origin}" no es un origen válido: usa solo protocolo y dominio, como https://tienda.com`,
          })
        } else if (env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `En producción ${key} debe usar https:// (ahora tiene "${origin}")`,
          })
        }
      }
    }
  })

/**
 * Indica si el texto es un origen válido (protocolo + dominio + puerto), por ejemplo https://tienda.com.
 */
function isOrigin(value: string) {
  try {
    return new URL(value).origin === value
  } catch {
    return false
  }
}

/** Variables de entorno ya validadas. */
export type Env = z.infer<typeof envSchema>

/** Valida un conjunto de variables (exportada para probar las reglas sin tocar process.env). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Configuración inválida en las variables de entorno:\n${problems}`)
  }
  return result.data
}

/** Configuración del servidor validada al arrancar: si falta algo, el servidor no inicia. */
export const env = parseEnv(process.env)

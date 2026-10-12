/**
 * Cliente HTTP de la tienda: la única función que habla con la API.
 * En desarrollo, Vite redirige /api al servidor (ver vite.config.ts); en producción
 * VITE_API_URL puede apuntar a otro dominio.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** Tiempo máximo de espera de una petición antes de mostrar el error. */
const TIMEOUT_MS = 10_000

export class ApiError extends Error {
  /** Código HTTP de la respuesta; 0 si no hubo conexión. */
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | undefined

export async function apiGet<T>(
  path: string,
  query?: Record<string, QueryValue> | URLSearchParams,
) {
  const params =
    query instanceof URLSearchParams
      ? query
      : new URLSearchParams(
          Object.entries(query ?? {}).flatMap(([key, value]) =>
            value === undefined || value === '' ? [] : [[key, String(value)]],
          ),
        )
  const search = params.size > 0 ? `?${params}` : ''

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}${search}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw new ApiError(response.status, body?.error?.message ?? `Error ${response.status}`)
  }
  return (await response.json()) as T
}

/**
 * Cliente HTTP de la tienda: la única función que habla con la API.
 * En desarrollo, Vite redirige /api al servidor (ver vite.config.ts); en producción
 * VITE_API_URL puede apuntar a otro dominio.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** Tiempo máximo de espera de una petición antes de mostrar el error. */
const TIMEOUT_MS = 10_000

interface ErrorBody {
  error?: { code?: string; message?: string; items?: unknown }
}

/**
 * Error de la API con su código HTTP, código de error y detalle (por ejemplo, los productos no disponibles).
 */
export class ApiError extends Error {
  /** Código HTTP de la respuesta; 0 si no hubo conexión. */
  readonly status: number
  /** Código de error de la API (VALIDATION_ERROR, ITEMS_UNAVAILABLE...). */
  readonly code?: string
  /** Detalle adicional que envía la API (por ejemplo, qué productos no están disponibles). */
  readonly items?: unknown

  constructor(status: number, message: string, body?: ErrorBody | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.error?.code
    this.items = body?.error?.items
  }
}

type QueryValue = string | number | undefined

/** Hace la petición con un tiempo máximo de espera y convierte cualquier falla en {@link ApiError}. */
async function request<T>(path: string, init: RequestInit) {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null
    throw new ApiError(response.status, body?.error?.message ?? `Error ${response.status}`, body)
  }
  return (await response.json()) as T
}

/** Petición GET con parámetros de búsqueda (los valores vacíos se omiten). */
export function apiGet<T>(path: string, query?: Record<string, QueryValue> | URLSearchParams) {
  const params =
    query instanceof URLSearchParams
      ? query
      : new URLSearchParams(
          Object.entries(query ?? {}).flatMap(([key, value]) =>
            value === undefined || value === '' ? [] : [[key, String(value)]],
          ),
        )
  const search = params.size > 0 ? `?${params}` : ''
  return request<T>(`${path}${search}`, { method: 'GET' })
}

/** Petición POST con cuerpo JSON. */
export function apiPost<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

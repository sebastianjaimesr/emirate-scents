import { ApiError } from '../services/apiClient'
import { useAdminSession } from './session'

/*
  Cliente HTTP del panel. El panel siempre se usa en el mismo dominio que la API, así que
  el navegador envía la cookie de sesión solo (credentials: 'same-origin') y la cabecera
  Origin que el servidor exige para los cambios. React nunca ve ni guarda la sesión.
*/

const TIMEOUT_MS = 20_000

interface ErrorBody {
  error?: {
    code?: string
    message?: string
    details?: { field: string; message: string }[]
  }
}

/** Error de la API con los mensajes por campo (para mostrarlos junto a cada campo). */
export class AdminApiError extends ApiError {
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, body?: ErrorBody | null) {
    super(status, message, body)
    this.fieldErrors = Object.fromEntries(
      (body?.error?.details ?? []).map((detail) => [detail.field, detail.message]),
    )
  }
}

/**
 * Hace una petición a /api/admin con la cookie de sesión. Envía JSON (o FormData para fotos)
 * y convierte las respuestas de error en {@link AdminApiError} con los mensajes por campo.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`/api/admin${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new AdminApiError(0, 'No hay conexión con el servidor')
  }

  if (response.status === 401 && path !== '/auth/login') {
    // La sesión caducó o se cerró: el panel vuelve a pedir el acceso
    useAdminSession.getState().expire()
  }
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ErrorBody | null
    throw new AdminApiError(
      response.status,
      errorBody?.error?.message ?? `Error ${response.status}`,
      errorBody,
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

type Query = Record<string, string | number | undefined>

export const adminApi = {
  get: <T>(path: string, query?: Query) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {}).flatMap(([key, value]) =>
        value === undefined || value === '' ? [] : [[key, String(value)]],
      ),
    )
    return request<T>('GET', params.size > 0 ? `${path}?${params}` : path)
  },
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: (path: string) => request<void>('DELETE', path),
}

/** Mensaje para mostrar al administrador a partir de cualquier error. */
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}

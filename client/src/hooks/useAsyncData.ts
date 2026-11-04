/**
 * Hook para cargar datos asíncronos con estado de carga, error y reintento.
 */
import { useEffect, useState } from 'react'

interface AsyncState<T> {
  key: string
  data?: T
  error?: Error
}

/**
 * Carga datos asíncronos (por ejemplo, desde productService) y expone el estado
 * de carga y de error.
 *
 * `key` identifica la petición: cuando cambia (otros filtros, otro producto), se vuelve
 * a cargar. Si el usuario cambia los filtros antes de que llegue la respuesta anterior,
 * esa respuesta antigua se descarta para no mostrar resultados desordenados.
 * `previousData` permite mantener visibles los resultados anteriores mientras llegan los nuevos.
 * `retry` repite la petición (botón "Intentar de nuevo" tras un error de red).
 */
export function useAsyncData<T>(key: string, load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<AsyncState<T>>({ key: '' })
  const requestKey = `${key}#${attempt}`

  useEffect(() => {
    let isCancelled = false
    load().then(
      (data) => !isCancelled && setState({ key: requestKey, data }),
      (error: unknown) =>
        !isCancelled &&
        setState({
          key: requestKey,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    )
    return () => {
      isCancelled = true
    }
    // `load` cambia en cada render; `requestKey` resume todo lo que influye en la petición
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const isCurrent = state.key === requestKey
  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : undefined,
    isLoading: !isCurrent,
    previousData: state.data,
    retry: () => setAttempt((count) => count + 1),
  }
}

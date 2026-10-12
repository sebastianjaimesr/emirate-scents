import { useSyncExternalStore } from 'react'

/**
 * true mientras la pantalla cumpla la consulta CSS (por ejemplo '(min-width: 768px)').
 * Se actualiza sola al girar el celular o cambiar el tamaño de la ventana.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

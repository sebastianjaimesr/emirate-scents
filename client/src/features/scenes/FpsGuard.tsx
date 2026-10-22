import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { createFpsWatch } from './fpsWatch'

/**
 * Va dentro de un <Canvas>: si la escena no logra 20 cuadros por segundo durante unos
 * segundos, llama a `onSlow` (una sola vez).
 * En navegadores automatizados (las pruebas) no se mide: dibujan sin tarjeta gráfica y
 * siempre irían lentos.
 */
export function FpsGuard({ onSlow }: { onSlow: () => void }) {
  const watch = useMemo(() => createFpsWatch(), [])
  const done = useRef(navigator.webdriver === true)
  useFrame((_, delta) => {
    if (done.current) return
    if (watch(delta)) {
      done.current = true
      onSlow()
    }
  })
  return null
}

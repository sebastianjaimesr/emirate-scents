import { useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'
import { supportsWebGL } from '../hero3d/webgl'

/**
 * ¿La sección se muestra en 3D o en su versión estática?
 * - "estatica" si el visitante pidió reducir movimiento, si el navegador no tiene WebGL o si
 *   la escena falló (se llama a `fallBack`). La versión estática muestra la misma información.
 * - "3d" en los demás casos.
 */
export function useSceneMode() {
  const prefersReducedMotion = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const [webgl] = useState(supportsWebGL)
  const fallBack = useCallback(() => setFailed(true), [])
  const mode: '3d' | 'estatica' = prefersReducedMotion || failed || !webgl ? 'estatica' : '3d'
  return { mode, fallBack }
}

/** Pantallas pequeñas o táctiles: las escenas usan menos partículas y menos resolución. */
export function isCompactScreen() {
  return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
}

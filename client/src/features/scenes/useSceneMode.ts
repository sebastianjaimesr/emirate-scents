import { useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'
import { supportsWebGL } from '../hero3d/webgl'
import { isLowPower } from './lowPower'

/**
 * ¿La sección se muestra en 3D o en su versión estática?
 * - "estatica" si el visitante pidió reducir movimiento, si el navegador no tiene WebGL, si
 *   la escena falló (se llama a `fallBack`) o si en esta visita las escenas ya fueron lentas
 *   (modo ligero). La versión estática muestra la misma información.
 * - "3d" en los demás casos.
 */
export function useSceneMode() {
  const prefersReducedMotion = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const [webgl] = useState(supportsWebGL)
  // Solo se mira al cargar: si el modo ligero empieza a mitad de la visita, la sección
  // conserva su forma (ver SceneSlot) para que la página no salte
  const [lowPower] = useState(isLowPower)
  const fallBack = useCallback(() => setFailed(true), [])
  const mode: '3d' | 'estatica' =
    prefersReducedMotion || failed || !webgl || lowPower ? 'estatica' : '3d'
  return { mode, fallBack }
}

/** Pantallas pequeñas o táctiles: las escenas usan menos partículas y menos resolución. */
export function isCompactScreen() {
  return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
}

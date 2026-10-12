/**
 * ¿Puede este navegador dibujar 3D? Se prueba creando un lienzo WebGL de verdad:
 * algunos equipos lo tienen desactivado o bloqueado y entonces el hero usa su composición
 * de reserva (arcos y logo), sin errores visibles.
 */
export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!context) return false
    // Libera el contexto de prueba de inmediato: los navegadores limitan cuántos hay abiertos
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Ejecuta `callback` cuando el navegador quede libre, para que el texto del hero se muestre
 * antes de descargar y preparar la escena 3D. Devuelve una función para cancelarlo.
 */
export function whenIdle(callback: () => void) {
  // Safari todavía no tiene requestIdleCallback: allí se espera un momento fijo
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 1500 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(callback, 300)
  return () => clearTimeout(id)
}

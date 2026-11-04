/**
 * ¿Puede este navegador dibujar 3D? Se prueba creando un lienzo WebGL de verdad:
 * algunos equipos lo tienen desactivado o bloqueado y entonces las escenas 3D del inicio usan
 * su versión estática, sin errores visibles.
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

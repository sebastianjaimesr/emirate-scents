/**
 * Vigila la fluidez de una escena 3D. Se le pasa el tiempo de cada cuadro (en segundos) y
 * responde true cuando la escena lleva varios tramos seguidos por debajo del mínimo de
 * cuadros por segundo: el teléfono no da abasto y conviene apagarla.
 *
 * - Los primeros `warmup` segundos no cuentan (al empezar, el navegador prepara la escena).
 * - Cada tramo dura `window` segundos; hacen falta `strikes` tramos lentos seguidos.
 * - Un cuadro de más de 5 segundos (la pestaña estuvo oculta, por ejemplo) no se cuenta.
 *   Los cuadros de medio segundo o un segundo sí cuentan: son los de un teléfono que no da
 *   abasto, justo los que hay que apagar.
 */
export function createFpsWatch({
  minFps = 20,
  warmup = 2,
  window = 2,
  strikes = 3,
}: { minFps?: number; warmup?: number; window?: number; strikes?: number } = {}) {
  let elapsed = 0
  let windowTime = 0
  let windowFrames = 0
  let slowWindows = 0
  return (delta: number) => {
    if (delta > 5) return false
    elapsed += delta
    // (el margen evita que el redondeo de los decimales retrase un tramo)
    if (elapsed < warmup - 1e-6) return false
    windowTime += delta
    windowFrames += 1
    if (windowTime < window - 1e-6) return false
    const fps = windowFrames / windowTime
    slowWindows = fps < minFps ? slowWindows + 1 : 0
    windowTime = 0
    windowFrames = 0
    return slowWindows >= strikes
  }
}

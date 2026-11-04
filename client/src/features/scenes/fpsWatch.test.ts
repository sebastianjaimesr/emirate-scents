import { describe, expect, it } from 'vitest'
import { createFpsWatch } from './fpsWatch'

/** Simula `seconds` segundos a `fps` cuadros por segundo; devuelve si la escena se apagaría. */
function run(watch: (delta: number) => boolean, fps: number, seconds: number) {
  let slow = false
  for (let i = 0; i < fps * seconds; i++) slow = watch(1 / fps) || slow
  return slow
}

describe('createFpsWatch', () => {
  it('no apaga una escena fluida', () => {
    expect(run(createFpsWatch(), 60, 20)).toBe(false)
  })

  it('apaga una escena que va lenta durante tres tramos seguidos', () => {
    const watch = createFpsWatch()
    // Calentamiento (2 s) más dos tramos lentos: todavía no
    expect(run(watch, 12, 6)).toBe(false)
    // El tercer tramo lento la apaga
    expect(run(watch, 12, 2)).toBe(true)
  })

  it('un tramo fluido reinicia la cuenta', () => {
    const watch = createFpsWatch()
    expect(run(watch, 12, 6)).toBe(false)
    expect(run(watch, 60, 2)).toBe(false)
    expect(run(watch, 12, 4)).toBe(false)
  })

  it('apaga una escena lentísima (menos de 2 cuadros por segundo)', () => {
    const watch = createFpsWatch()
    let slow = false
    // 0.7 s por cuadro: calentamiento y tres tramos lentos caben en 12 s
    for (let i = 0; i < 17; i++) slow = watch(0.7) || slow
    expect(slow).toBe(true)
  })

  it('ignora los cuadros muy largos (pestaña oculta)', () => {
    const watch = createFpsWatch()
    for (let i = 0; i < 20; i++) expect(watch(30)).toBe(false)
  })
})

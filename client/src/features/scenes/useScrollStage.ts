import { useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState } from 'react'

/**
 * Escenario fijado al hacer scroll, compartido por las secciones 3D del inicio.
 *
 * La sección es más alta que la pantalla y su contenido queda fijo (position: sticky)
 * mientras se recorre. Bajar avanza al perfume siguiente; subir, al anterior. Al terminar
 * la sección, la página sigue con normalidad: nunca se bloquea el scroll.
 *
 * - `progress`: 0 al empezar la sección, 1 al terminarla (con un resorte suave).
 * - `position`: lo mismo medido en perfumes (0 = el primero, count - 1 = el último).
 * - `active`: el perfume más cercano, para el texto que acompaña a la escena.
 */
export function useScrollStage(count: number) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0005 })
  const position = useTransform(progress, (p) => p * Math.max(count - 1, 0))
  const [active, setActive] = useState(0)
  useMotionValueEvent(position, 'change', (value) => {
    setActive(Math.min(count - 1, Math.max(0, Math.round(value))))
  })

  /** Lleva la página al punto en que el perfume `index` queda al frente (para el teclado). */
  const scrollToItem = (index: number) => {
    const section = sectionRef.current
    if (!section || count < 2) return
    const top = section.getBoundingClientRect().top + window.scrollY
    const scrollable = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (index / (count - 1)) * scrollable, behavior: 'instant' })
  }

  return { sectionRef, progress, position, active, scrollToItem }
}

/** Alto de la sección: una pantalla más `perItem` (en alto de pantalla) por cada perfume. */
export function stageHeight(count: number, perItemSvh: number) {
  return `calc(100svh + ${Math.max(count - 1, 0) * perItemSvh}svh)`
}

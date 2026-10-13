import {
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from 'motion/react'
import { useRef, type PointerEvent, type RefObject } from 'react'

/** Grados máximos de inclinación: perspectiva ligera, nunca un giro que dificulte leer. */
const MAX_TILT = 6

const spring = { stiffness: 220, damping: 22 }

export interface Tilt {
  /** Se conectan al marco de la foto. */
  frameProps: {
    ref: RefObject<HTMLDivElement | null>
    style: {
      rotateX: MotionValue<number>
      rotateY: MotionValue<number>
      transformPerspective: number
    }
  }
  light: MotionValue<string>
  /** Se conectan a la tarjeta completa (el enlace la cubre entera). */
  handlers: {
    onPointerMove: (event: PointerEvent<HTMLElement>) => void
    onPointerLeave: () => void
  }
}

/**
 * Inclinación hacia el cursor y reflejo de luz que lo sigue. Solo con ratón: en pantallas
 * táctiles o con "reducir movimiento" la foto se queda quieta.
 */
export function useTilt(): Tilt {
  const prefersReducedMotion = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, spring)
  const rotateY = useSpring(0, spring)
  const lightX = useMotionValue(50)
  const lightY = useMotionValue(30)
  const light = useMotionTemplate`radial-gradient(circle at ${lightX}% ${lightY}%, rgb(255 248 236 / 0.28), transparent 55%)`

  return {
    frameProps: { ref: frameRef, style: { rotateX, rotateY, transformPerspective: 900 } },
    light,
    handlers: {
      onPointerMove(event) {
        const frame = frameRef.current
        if (!frame || event.pointerType !== 'mouse' || prefersReducedMotion) return
        const rect = frame.getBoundingClientRect()
        // Fuera de la foto (sobre el nombre o el precio) la inclinación se limita al borde
        const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
        const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
        rotateY.set((px - 0.5) * 2 * MAX_TILT)
        rotateX.set(-(py - 0.5) * 2 * MAX_TILT)
        lightX.set(px * 100)
        lightY.set(py * 100)
      },
      onPointerLeave() {
        rotateX.set(0)
        rotateY.set(0)
      },
    },
  }
}

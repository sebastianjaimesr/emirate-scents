import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Retraso en segundos, útil para escalonar elementos. */
  delay?: number
  as?: 'div' | 'li' | 'section'
}

/**
 * Hace aparecer su contenido suavemente la primera vez que entra en pantalla.
 * Con "reducir movimiento" activado en el sistema, MotionConfig (en RootLayout)
 * elimina el desplazamiento y deja solo el fundido.
 */
export function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  )
}

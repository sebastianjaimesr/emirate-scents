import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import type { Tilt } from './useTilt'

/** Marco de la foto de una tarjeta: se inclina, se ilumina y gana sombra al pasar el cursor. */
export function TiltFrame({
  tilt,
  children,
  className,
}: {
  tilt: Tilt
  children: ReactNode
  className?: string
}) {
  return (
    <m.div
      {...tilt.frameProps}
      className={cx(
        'relative overflow-hidden transition-shadow duration-500 ease-luxe group-hover:shadow-[0_28px_40px_-22px_rgb(14_12_10/0.55)]',
        className,
      )}
    >
      {children}
      <m.div
        aria-hidden="true"
        style={{ background: tilt.light }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
    </m.div>
  )
}

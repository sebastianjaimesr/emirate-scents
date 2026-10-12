import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** Limita el ancho del contenido y aplica los márgenes laterales responsive. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12', className)}>
      {children}
    </div>
  )
}

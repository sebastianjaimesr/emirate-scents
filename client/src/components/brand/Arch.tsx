import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/*
  El arco apuntado (inspirado en el mihrab de la arquitectura árabe) es el gesto
  visual propio de Emirate Scents. Se dibuja en coordenadas de 0 a 1 para que
  se adapte a cualquier tamaño de caja.
*/
const ARCH_PATH = 'M0,1 L0,0.38 C0,0.17 0.3,0.06 0.5,0 C0.7,0.06 1,0.17 1,0.38 L1,1 Z'

/** Definición única del recorte. Se monta una sola vez en RootLayout. */
export function ArchClipDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <clipPath id="es-arch" clipPathUnits="objectBoundingBox">
          <path d={ARCH_PATH} />
        </clipPath>
      </defs>
    </svg>
  )
}

/** Solo el contorno del arco (línea dorada fina). */
export function ArchOutline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className={cx('pointer-events-none absolute inset-0 size-full overflow-visible', className)}
    >
      {/* non-scaling-stroke mantiene la línea en 1 px aunque el arco se estire */}
      <path
        d={ARCH_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface ArchFrameProps {
  children?: ReactNode
  className?: string
  /** Clases del contenido recortado (fondo, etc.). */
  innerClassName?: string
  outlineClassName?: string
}

/** Contenido recortado con forma de arco y contorno dorado. */
export function ArchFrame({
  children,
  className,
  innerClassName,
  outlineClassName,
}: ArchFrameProps) {
  return (
    <div className={cx('relative', className)}>
      <div
        className={cx('absolute inset-0 overflow-hidden [clip-path:url(#es-arch)]', innerClassName)}
      >
        {children}
      </div>
      <ArchOutline className={cx('text-gold-500', outlineClassName)} />
    </div>
  )
}

/** Arcos concéntricos de línea fina: textura decorativa cuando aún no hay fotografía. */
export function ArchPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 260"
      className={cx('size-full', className)}
      preserveAspectRatio="xMidYMax slice"
    >
      {[0, 1, 2, 3].map((step) => {
        const inset = 18 + step * 18
        const w = 200 - inset * 2
        const top = 30 + step * 22
        return (
          <path
            key={step}
            d={`M${inset},260 L${inset},${top + w * 0.38} C${inset},${top + w * 0.17} ${inset + w * 0.3},${top + w * 0.06} 100,${top} C${200 - inset - w * 0.3},${top + w * 0.06} ${200 - inset},${top + w * 0.17} ${200 - inset},${top + w * 0.38} L${200 - inset},260`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
          />
        )
      })}
    </svg>
  )
}

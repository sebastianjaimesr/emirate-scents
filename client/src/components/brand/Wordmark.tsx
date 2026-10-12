import { cx } from '../../lib/cx'

/**
 * Versión tipográfica compacta del logotipo para el header.
 * El logo completo (con pedrería y corona) pierde detalle a tamaños pequeños,
 * por eso aquí se usa solo el nombre con la misma tipografía clásica.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('flex flex-col items-center leading-none', className)}>
      <span className="font-display text-[1.45rem] font-semibold tracking-[0.18em] sm:text-[1.65rem]">
        EMIRATE
      </span>
      <span className="mt-1 text-[0.58rem] font-semibold tracking-[0.62em] sm:text-[0.62rem]">
        SCENTS
      </span>
    </span>
  )
}

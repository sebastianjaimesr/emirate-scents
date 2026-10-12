import { cx } from '../../lib/cx'

/** Divisor fino con un rombo central, inspirado en el ornamento del logo. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('flex items-center gap-3 text-gold-500', className)}>
      <span className="h-px w-12 bg-current opacity-60" />
      <span className="size-1.5 rotate-45 border border-current" />
      <span className="h-px w-12 bg-current opacity-60" />
    </div>
  )
}

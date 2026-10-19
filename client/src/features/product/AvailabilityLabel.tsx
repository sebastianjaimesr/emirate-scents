/**
 * Indicador de disponibilidad de un producto (disponible, pocas unidades o agotado).
 */
import { getAvailability } from '../../lib/availability'
import { cx } from '../../lib/cx'

const dotColor = {
  available: 'bg-emerald-700',
  low: 'bg-amber-600',
  'sold-out': 'bg-smoke-500',
} as const

/** Muestra un punto de color y el texto de disponibilidad según el stock. */
export function AvailabilityLabel({ stock }: { stock: number }) {
  const availability = getAvailability(stock)
  return (
    <p className="flex items-center gap-2 text-sm text-ink-900">
      <span
        aria-hidden="true"
        className={cx('size-2 rounded-full', dotColor[availability.status])}
      />
      {availability.label}
    </p>
  )
}

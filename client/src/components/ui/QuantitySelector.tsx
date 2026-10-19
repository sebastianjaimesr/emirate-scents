/**
 * Selector de cantidad con botones − y +.
 */
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
  size?: 'md' | 'sm'
}

/** Selector de cantidad entre 1 y el inventario disponible. */
export function QuantitySelector({
  value,
  max,
  onChange,
  disabled = false,
  label = 'Cantidad',
  size = 'md',
}: QuantitySelectorProps) {
  const buttonClass = `grid ${size === 'sm' ? 'size-10' : 'size-12'} place-items-center transition-colors hover:bg-cream-100 disabled:pointer-events-none disabled:opacity-30`

  return (
    <div
      className="inline-flex items-center border border-ink-900/30"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Reducir cantidad"
        className={buttonClass}
      >
        <Minus aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </button>
      <output aria-live="polite" className="w-9 text-center text-sm font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Aumentar cantidad"
        className={buttonClass}
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

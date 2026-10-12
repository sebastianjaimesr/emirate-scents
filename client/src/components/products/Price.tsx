import { formatCOP } from '../../lib/formatCOP'
import { cx } from '../../lib/cx'

/** Precio en COP; el precio anterior solo aparece si es mayor (descuento real). */
export function Price({
  price,
  compareAtPrice,
  className,
}: {
  price: number
  compareAtPrice?: number
  className?: string
}) {
  const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price
  return (
    <p className={cx('flex flex-wrap items-baseline gap-x-2 tabular-nums', className)}>
      <span className="font-semibold">{formatCOP(price)}</span>
      {hasDiscount && (
        <s className="text-[0.85em] text-smoke-500">
          <span className="sr-only">Antes </span>
          {formatCOP(compareAtPrice)}
        </s>
      )}
    </p>
  )
}

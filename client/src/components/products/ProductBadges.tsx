/**
 * Etiquetas que se muestran sobre los productos (DEMO, agotado, oferta…).
 */
import { cx } from '../../lib/cx'
import type { Product } from '../../types/product'

const badgeBase =
  'inline-flex h-6 items-center px-2 text-[0.6rem] font-bold tracking-[0.16em] uppercase'

/** Etiqueta "DEMO" para productos ficticios. Imposible de pasar por alto. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(badgeBase, 'bg-ruby-600 text-ivory-50', className)}
      title="Producto de demostración: no está a la venta"
    >
      Demo
    </span>
  )
}

/** Etiquetas comerciales. Cada una depende de un dato real del producto. */
export function ProductBadges({ product, className }: { product: Product; className?: string }) {
  const isSoldOut = product.stock <= 0
  const hasDiscount = product.compareAtPrice !== undefined && product.compareAtPrice > product.price

  return (
    <div className={cx('flex flex-wrap gap-1.5', className)}>
      {product.isDemo && <DemoBadge />}
      {isSoldOut && <span className={cx(badgeBase, 'bg-ink-900 text-ivory-50')}>Agotado</span>}
      {!isSoldOut && hasDiscount && (
        <span className={cx(badgeBase, 'bg-gold-500 text-ink-950')}>Oferta</span>
      )}
      {product.isNew && <span className={cx(badgeBase, 'bg-ivory-50 text-ink-900')}>Nuevo</span>}
      {product.isBestSeller && (
        <span className={cx(badgeBase, 'bg-ivory-50 text-ink-900')}>Más vendido</span>
      )}
    </div>
  )
}

import { ArrowRight } from 'lucide-react'
import { m } from 'motion/react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { Price } from '../../components/products/Price'
import { cx } from '../../lib/cx'
import type { Product } from '../../types/product'
import { productDetails } from './productDetails'

const ease = [0.22, 1, 0.36, 1] as const

/** Encabezado de una sección 3D, sobre fondo oscuro. */
export function StageHeading({
  id,
  eyebrow,
  title,
  hasDemo,
  className,
}: {
  id: string
  eyebrow: string
  title: string
  hasDemo: boolean
  className?: string
}) {
  return (
    <div className={cx('max-w-xl', className)}>
      <p className="eyebrow text-gold-500">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-4xl leading-[1.05] text-ivory-50 xl:text-5xl">
        {title}
      </h2>
      {hasDemo && (
        <p className="mt-3 text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">
          Productos de demostración: no están a la venta
        </p>
      )}
    </div>
  )
}

/**
 * Ficha del perfume que está al frente de la escena: marca, nombre, detalles, precio y
 * enlace. Cambia con un fundido al pasar al siguiente perfume.
 */
export function StageDetails({
  product,
  align = 'center',
  className,
}: {
  product: Product
  align?: 'center' | 'left'
  className?: string
}) {
  const details = productDetails(product)
  return (
    <div className={cx('relative', className)} aria-live="polite">
      <m.div
        key={product.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className={cx(
          'flex flex-col gap-1.5',
          align === 'center' ? 'items-center text-center' : 'items-start',
        )}
      >
        {product.isDemo && <DemoBadge className="mb-1" />}
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-500 uppercase">
          {product.brand.name}
        </p>
        <h3 className="text-3xl leading-tight text-ivory-50">{product.name}</h3>
        {details && <p className="text-xs text-smoke-300">{details}</p>}
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          className={cx('text-sm text-ivory-50', align === 'center' && 'justify-center')}
        />
        <Link
          to={`/producto/${product.slug}`}
          className="group mt-2 inline-flex items-center gap-2 border-b border-gold-500/60 pb-1 text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase transition-colors hover:border-gold-300 hover:text-ivory-50"
        >
          Ver perfume<span className="sr-only">: {product.name}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      </m.div>
    </div>
  )
}

/** "03 / 08" y una línea que se llena con el recorrido. */
export function StageCounter({ active, count }: { active: number; count: number }) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    <p className="font-display text-2xl text-ivory-50 tabular-nums" aria-hidden="true">
      {pad(active + 1)}
      <span className="mx-2 text-gold-500">/</span>
      <span className="text-smoke-300">{pad(count)}</span>
    </p>
  )
}

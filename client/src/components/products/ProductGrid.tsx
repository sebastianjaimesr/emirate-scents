import { AnimatePresence, m } from 'motion/react'
import { cx } from '../../lib/cx'
import type { Product } from '../../types/product'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  className?: string
  /** Número de tarjetas iniciales que se cargan con prioridad (las visibles al entrar). */
  priorityCount?: number
}

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4'

/** Cuadrícula con animación suave cuando los filtros añaden o quitan productos. */
export function ProductGrid({ products, className, priorityCount = 0 }: ProductGridProps) {
  return (
    <ul className={cx(gridClass, className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((product, index) => (
          <m.li
            key={product.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCard product={product} priority={index < priorityCount} />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div role="status" aria-label="Cargando productos" className={cx(gridClass, className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

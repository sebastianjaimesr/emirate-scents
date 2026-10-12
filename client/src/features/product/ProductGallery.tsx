import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ProductImage } from '../../components/products/ProductImage'
import { cx } from '../../lib/cx'
import type { Product } from '../../types/product'

/** Imagen principal con miniaturas. Sin fotos, muestra el estado de reserva. */
export function ProductGallery({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = product.images[activeIndex]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-100">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            className="size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductImage
              image={activeImage}
              fallbackLabel={product.name}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {product.images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Galería de imágenes">
          {product.images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${product.images.length}`}
                aria-current={index === activeIndex}
                className={cx(
                  'block aspect-square w-full overflow-hidden border transition-colors',
                  index === activeIndex
                    ? 'border-ink-900'
                    : 'border-transparent hover:border-sand-300',
                )}
              >
                <ProductImage image={image} fallbackLabel={product.name} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { AnimatePresence, m } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { ProductImage } from '../../components/products/ProductImage'
import { cx } from '../../lib/cx'
import type { Product } from '../../types/product'

/** Imagen principal con miniaturas. Sin fotos, muestra el estado de reserva. */
export function ProductGallery({ product }: { product: Product }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = product.images[activeIndex]
  // Punto de la foto que se amplía al pasar el cursor (solo con foto real y ratón)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')

  function handleZoomMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  return (
    <div className="space-y-3">
      <div
        onMouseMove={activeImage ? handleZoomMove : undefined}
        className={cx(
          'group relative aspect-[4/5] overflow-hidden bg-cream-100',
          activeImage && '[@media(hover:hover)]:cursor-zoom-in',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={activeIndex}
            className="size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              style={{ transformOrigin: zoomOrigin }}
              className={cx(
                'size-full transition-transform duration-500 ease-luxe',
                // Lupa: la foto se amplía hacia donde apunta el cursor
                activeImage && '[@media(hover:hover)]:group-hover:scale-[1.8]',
              )}
            >
              <ProductImage
                image={activeImage}
                fallbackLabel={product.name}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </m.div>
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

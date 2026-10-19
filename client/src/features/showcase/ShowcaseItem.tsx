/**
 * Un frasco de la vitrina con su nombre, precio y enlace a la ficha.
 */
import { mediaUrl } from '../../lib/mediaUrl'
import { m, useTransform, type MotionValue } from 'motion/react'
import type { FocusEvent } from 'react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { Price } from '../../components/products/Price'
import { cx } from '../../lib/cx'
import { concentrationLabels, type Product } from '../../types/product'
import { BottleIllustration } from './BottleIllustration'

interface ShowcaseItemProps {
  product: Product
  index: number
  /**
   * Solo en la vitrina fijada: posición de la fila medida en "perfumes" (0 = el primero en el
   * centro, 1 = el segundo...). Con ella cada frasco calcula su escala, giro y brillo.
   */
  position?: MotionValue<number>
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void
}

/** Limita un valor al rango de -limit a +limit. */
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** Un perfume de la vitrina: frasco con luz y sombra, nombre, marca, precio y enlace. */
export function ShowcaseItem({ product, index, position, onFocus }: ShowcaseItemProps) {
  const isPinned = position !== undefined
  // Distancia al centro de la pantalla: 0 = en el centro, +1 = un perfume a la izquierda...
  const distance = useTransform(() => (position ? position.get() - index : 0))
  const scale = useTransform(distance, (d) => 1 - Math.min(Math.abs(d), 2) * 0.12)
  // Los frascos de los lados se orientan hacia el centro, como en una vitrina curva
  const rotateY = useTransform(distance, (d) => clamp(d * 14, 26))
  const opacity = useTransform(distance, (d) => 1 - Math.min(Math.abs(d), 2.4) * 0.28)
  const y = useTransform(distance, (d) => Math.min(Math.abs(d), 2) * 18)
  const bottleRotate = useTransform(distance, (d) => clamp(-d * 4, 6))
  const glow = useTransform(distance, (d) => 1 - Math.min(Math.abs(d), 1))

  const image = product.images[0]
  const details = [
    product.sizeMl && `${product.sizeMl} ml`,
    product.concentration && concentrationLabels[product.concentration],
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <m.article
      style={isPinned ? { scale, rotateY, opacity, y } : undefined}
      className="group relative flex w-[var(--showcase-item)] shrink-0 flex-col items-center text-center"
    >
      <div className="relative aspect-[3/4] w-full">
        {/* Arco dorado, luz cálida y sombra bajo el frasco */}
        <svg
          aria-hidden="true"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full text-gold-500/35 transition-colors duration-500 group-hover:text-gold-500/70"
        >
          <path
            d="M10,400 L10,150 C10,80 90,30 150,10 C210,30 290,80 290,150 L290,400"
            fill="rgb(26 22 18 / 0.6)"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <m.div
          aria-hidden="true"
          style={isPinned ? { opacity: glow } : undefined}
          className="absolute inset-x-[10%] top-[20%] bottom-[10%] bg-[radial-gradient(ellipse_at_50%_55%,rgb(201_165_78/0.28),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-[22%] bottom-[16%] h-[5%] rounded-[50%] bg-black/70 blur-md"
        />

        <m.div
          style={isPinned ? { rotate: bottleRotate } : undefined}
          className="absolute inset-x-[12%] top-[8%] bottom-[2%] transition-transform duration-700 ease-luxe group-hover:-translate-y-2"
        >
          {image ? (
            <img
              src={mediaUrl(image.url)}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-contain drop-shadow-[0_24px_30px_rgb(0_0_0/0.55)]"
            />
          ) : (
            <BottleIllustration seed={product.id} className="size-full" />
          )}
        </m.div>
      </div>

      <div className="mt-4">
        {product.isDemo && <DemoBadge className="mb-2" />}
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-500 uppercase">
          {product.brand.name}
        </p>
        <h3 className="mt-1.5 text-2xl leading-tight text-ivory-50">
          {/* El enlace cubre todo el perfume (::after) para que sea fácil de pulsar */}
          <Link
            to={`/producto/${product.slug}`}
            onFocus={onFocus}
            className={cx(
              "after:absolute after:inset-0 after:content-['']",
              'focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold-500',
            )}
          >
            {product.name}
          </Link>
        </h3>
        {details && <p className="mt-1 text-xs text-smoke-300">{details}</p>}
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          className="mt-2 justify-center text-sm text-ivory-50"
        />
        {!image && (
          <p className="mt-2 text-[0.6rem] tracking-[0.18em] text-smoke-300 uppercase">
            Ilustración · foto próximamente
          </p>
        )}
      </div>
    </m.article>
  )
}

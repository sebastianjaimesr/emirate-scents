import { Link } from 'react-router'
import { categories } from '../../data/categories'
import { AddToCartButton } from '../../features/cart/AddToCartButton'
import { FavoriteButton } from '../../features/favorites/FavoriteButton'
import { getAvailability } from '../../lib/availability'
import { cx } from '../../lib/cx'
import { concentrationLabels, type Product } from '../../types/product'
import { Price } from './Price'
import { ProductBadges } from './ProductBadges'
import { ProductImage } from './ProductImage'
import { TiltFrame } from './TiltFrame'
import { useTilt } from './useTilt'

const availabilityDot = {
  available: 'bg-emerald-700',
  low: 'bg-amber-600',
  'sold-out': 'bg-smoke-500',
} as const

/**
 * Tarjeta de producto para cuadrículas del catálogo y de la página de inicio.
 * La foto va sobre un "escenario" negro con luz dorada (.photo-stage) y se muestra completa
 * (object-contain), sin recortes ni deformaciones; al pasar el cursor se acerca suavemente.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const details = [
    product.sizeMl && `${product.sizeMl} ml`,
    product.concentration && concentrationLabels[product.concentration],
  ]
    .filter(Boolean)
    .join(' · ')
  const tilt = useTilt()
  const category = categories.find((entry) => entry.slug === product.categorySlug)
  // "Línea Equivalencias · Equivalencias" sería repetir lo mismo
  const showCategory =
    category && !product.brand.name.toLowerCase().includes(category.shortName.toLowerCase())
  const availability = getAvailability(product.stock)

  return (
    <article
      {...tilt.handlers}
      className="group relative flex h-full flex-col transition-transform duration-500 ease-luxe hover:-translate-y-1"
    >
      <div className="relative">
        <TiltFrame tilt={tilt} className="aspect-[4/5] bg-noir">
          <div className="photo-stage size-full transition-transform duration-700 ease-luxe group-hover:scale-[1.05]">
            <ProductImage
              image={product.images[0]}
              fallbackLabel={product.name}
              priority={priority}
              onStage
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          </div>
          <ProductBadges product={product} className="absolute top-3 left-3" />
        </TiltFrame>
        {/* Fuera del marco inclinado (su transform crearía un contexto de apilamiento propio) y
            con z-10, para quedar por encima del enlace que cubre toda la tarjeta */}
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute top-2 right-2 z-10"
        />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-gold-700 uppercase">
          {product.brand.name}
          {showCategory && (
            <span className="font-medium text-smoke-500">
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              {category.shortName}
            </span>
          )}
        </p>
        <h3 className="mt-1.5 text-xl leading-tight text-ink-950 sm:text-2xl">
          {/* El enlace cubre toda la tarjeta (::after) para que sea fácil de pulsar */}
          <Link
            to={`/producto/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold-500"
          >
            {product.name}
          </Link>
        </h3>
        {details && <p className="mt-1 text-xs text-smoke-500">{details}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-smoke-500">
          <span
            aria-hidden="true"
            className={cx('size-1.5 rounded-full', availabilityDot[availability.status])}
          />
          {availability.label}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            className="text-base text-ink-950"
          />
          <AddToCartButton
            product={product}
            quantity={1}
            variant="compact"
            className="max-sm:w-full"
          />
        </div>
      </div>
    </article>
  )
}

/** Marcador de carga con la misma forma que la tarjeta (evita saltos de diseño). */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[4/5] bg-cream-100" />
      <div className="mt-4 h-2.5 w-1/3 bg-sand-300/60" />
      <div className="mt-3 h-5 w-3/4 bg-sand-300/60" />
      <div className="mt-4 h-3 w-1/4 bg-sand-300/60" />
    </div>
  )
}

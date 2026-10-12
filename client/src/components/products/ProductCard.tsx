import { Link } from 'react-router'
import { FavoriteButton } from '../../features/favorites/FavoriteButton'
import { concentrationLabels, type Product } from '../../types/product'
import { Price } from './Price'
import { ProductBadges } from './ProductBadges'
import { ProductImage } from './ProductImage'

/** Tarjeta de producto para cuadrículas del catálogo y de la página de inicio. */
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

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="size-full transition-transform duration-700 ease-luxe group-hover:scale-[1.04]">
          <ProductImage
            image={product.images[0]}
            fallbackLabel={product.name}
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        </div>
        <ProductBadges product={product} className="absolute top-3 left-3" />
        {/* z-10: por encima del enlace que cubre toda la tarjeta */}
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute top-2 right-2 z-10"
        />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-gold-700 uppercase">
          {product.brand.name}
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
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          className="mt-auto pt-3 text-sm text-ink-950"
        />
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

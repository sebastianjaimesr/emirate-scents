import { m } from 'motion/react'
import { lazy, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { Price } from '../../components/products/Price'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { sceneContent } from '../../content/home'
import { useAsyncData } from '../../hooks/useAsyncData'
import { mediaUrl } from '../../lib/mediaUrl'
import type { Product } from '../../types/product'
import { getCollection } from '../scenes/collection'
import { SceneSlot } from '../scenes/SceneSlot'
import { productDetails } from '../scenes/productDetails'
import { StageCounter, StageDetails, StageHeading } from '../scenes/StageParts'
import { isCompactScreen, useSceneMode } from '../scenes/useSceneMode'
import { stageHeight, useScrollStage } from '../scenes/useScrollStage'
import type { GalleryItem } from './GalleryScene'

const GalleryScene = lazy(() => import('./GalleryScene'))

/**
 * "Galería con pedestales". Con 3D, la cámara recorre una sala oscura de pedestal en
 * pedestal al bajar la página. Sin 3D, los mismos perfumes aparecen como placas en una
 * cuadrícula.
 */
export function PedestalGallery() {
  const { data: products } = useAsyncData('coleccion', getCollection)
  const { mode, fallBack } = useSceneMode()

  if (!products || products.length === 0) return null
  const hasDemo = products.some((product) => product.isDemo)
  return mode === '3d' && products.length > 1 ? (
    <GalleryStage products={products} hasDemo={hasDemo} onError={fallBack} />
  ) : (
    <GalleryGrid products={products} hasDemo={hasDemo} />
  )
}

function GalleryStage({
  products,
  hasDemo,
  onError,
}: {
  products: Product[]
  hasDemo: boolean
  onError: () => void
}) {
  const { sectionRef, progress, active, scrollToItem } = useScrollStage(products.length)
  const [compact] = useState(isCompactScreen)
  const items = useMemo<GalleryItem[]>(
    () =>
      products.map((product) => ({
        id: product.id,
        brand: product.brand.name,
        name: product.name,
        details: productDetails(product),
        isDemo: product.isDemo,
        imageUrl: product.images[0] && mediaUrl(product.images[0].url),
      })),
    [products],
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="galeria-title"
      data-scene="galeria"
      className="relative bg-ink-950"
      style={{ height: stageHeight(products.length, 50) }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <SceneSlot onError={onError}>
          {(callbacks) => (
            <GalleryScene items={items} progress={progress} compact={compact} {...callbacks} />
          )}
        </SceneSlot>
        {/* Oscurece los bordes para que el texto se lea sobre la escena */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_12_10/0.85),transparent_28%,transparent_62%,rgb(14_12_10/0.92))]"
        />

        <div className="pointer-events-none relative flex h-full flex-col pt-18 xl:pt-22">
          <Container className="flex flex-wrap items-end justify-between gap-6 pt-6 xl:pt-8">
            <StageHeading id="galeria-title" hasDemo={hasDemo} {...sceneContent.gallery} />
            <StageCounter active={active} count={products.length} />
          </Container>
          <div className="flex-1" />
          <Container className="pb-8">
            <StageDetails product={products[active]} className="pointer-events-auto" />
            <div className="pointer-events-auto mt-6 flex justify-center gap-2">
              {products.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => scrollToItem(index)}
                  aria-label={`Ir a ${product.name}`}
                  aria-current={index === active ? 'true' : undefined}
                  className="group grid size-6 place-items-center"
                >
                  <m.span
                    animate={{ width: index === active ? 22 : 6 }}
                    className="block h-1.5 rounded-full bg-gold-500/40 group-aria-[current=true]:bg-gold-500"
                  />
                </button>
              ))}
            </div>
          </Container>
        </div>
      </div>
    </section>
  )
}

/** Versión sin animación: placas con el nombre (o la foto) en una cuadrícula. */
function GalleryGrid({ products, hasDemo }: { products: Product[]; hasDemo: boolean }) {
  return (
    <section
      aria-labelledby="galeria-title"
      data-scene="galeria-estatica"
      className="bg-ink-950 py-20 sm:py-28"
    >
      <Container>
        <StageHeading id="galeria-title" hasDemo={hasDemo} {...sceneContent.gallery} />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => {
            const image = product.images[0]
            return (
              <Reveal as="li" key={product.id} delay={(index % 4) * 0.06}>
                <article className="group relative flex h-full flex-col items-center border border-gold-500/40 bg-[linear-gradient(to_bottom,#221c16,#120f0c)] p-6 text-center outline outline-1 -outline-offset-8 outline-gold-500/20">
                  {image ? (
                    <img
                      src={mediaUrl(image.url)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="mb-4 aspect-[3/4] w-full object-contain"
                    />
                  ) : null}
                  {product.isDemo && <DemoBadge className="mb-3" />}
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-500 uppercase">
                    {product.brand.name}
                  </p>
                  <h3 className="mt-2 text-3xl leading-tight text-ivory-50">
                    <Link
                      to={`/producto/${product.slug}`}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold-500"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-smoke-300">{productDetails(product)}</p>
                  <Price
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    className="mt-3 justify-center text-sm text-ivory-50"
                  />
                </article>
              </Reveal>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}

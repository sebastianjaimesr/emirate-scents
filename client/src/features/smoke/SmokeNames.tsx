import { m, type MotionValue } from 'motion/react'
import { lazy, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { Price } from '../../components/products/Price'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { sceneContent } from '../../content/home'
import { useAsyncData } from '../../hooks/useAsyncData'
import type { Product } from '../../types/product'
import { getCollection } from '../scenes/collection'
import { familyColor } from '../scenes/familyPalette'
import { SceneSlot } from '../scenes/SceneSlot'
import { productDetails } from '../scenes/productDetails'
import { StageDetails, StageHeading, StageIndex } from '../scenes/StageParts'
import { isCompactScreen, useSceneMode } from '../scenes/useSceneMode'
import { stageHeight, useScrollStage } from '../scenes/useScrollStage'

const SmokeScene = lazy(() => import('./SmokeScene'))

/** Cuántos nombres escribe el humo. */
const MAX_ITEMS = 5

/**
 * "Humo que forma el nombre": primera sección después del hero.
 * Con 3D, una nube de partículas doradas escribe el nombre de cada perfume al bajar la
 * página. Sin 3D (reducir movimiento, sin WebGL o si la escena falla), los mismos perfumes
 * aparecen como una lista tipográfica.
 */
export function SmokeNames() {
  const { data } = useAsyncData('coleccion', getCollection)
  const products = useMemo(() => data?.slice(0, MAX_ITEMS) ?? [], [data])
  const { mode, fallBack } = useSceneMode()

  if (products.length === 0) return null
  const hasDemo = products.some((product) => product.isDemo)
  return mode === '3d' && products.length > 1 ? (
    <SmokeStage products={products} hasDemo={hasDemo} onError={fallBack} />
  ) : (
    <SmokeList products={products} hasDemo={hasDemo} />
  )
}

function SmokeStage({
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
  const names = useMemo(() => products.map((product) => product.name), [products])
  const colors = useMemo(
    () => products.map((product) => familyColor(product.olfactoryFamily)),
    [products],
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="humo-title"
      data-scene="humo"
      className="relative bg-ink-950"
      style={{ height: stageHeight(products.length, 55) }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgb(201_165_78/0.08),transparent_70%)]"
        />
        <SceneSlot onError={onError}>
          {(callbacks) => (
            <SmokeScene
              names={names}
              colors={colors}
              progress={progress}
              compact={compact}
              {...callbacks}
            />
          )}
        </SceneSlot>

        <div className="pointer-events-none relative flex h-full flex-col pt-18 xl:pt-22">
          <Container className="pt-6 xl:pt-8">
            <StageHeading id="humo-title" hasDemo={hasDemo} {...sceneContent.smoke} />
          </Container>
          <div className="flex-1" />
          <Container className="pb-8">
            <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <StageIndex
                label="Perfumes de la colección"
                products={products}
                active={active}
                onSelect={scrollToItem}
                className="pointer-events-auto hidden lg:block"
              />
              <StageDetails
                product={products[active]}
                showName={false}
                className="pointer-events-auto"
              />
            </div>
            <ProgressLine progress={progress} />
          </Container>
        </div>
      </div>
    </section>
  )
}

function ProgressLine({ progress }: { progress: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="mt-6 h-px w-full bg-gold-500/20">
      <m.div style={{ scaleX: progress }} className="h-full origin-left bg-gold-500" />
    </div>
  )
}

/** Versión sin animación: los nombres en grande, cada uno con su enlace. */
function SmokeList({ products, hasDemo }: { products: Product[]; hasDemo: boolean }) {
  return (
    <section
      aria-labelledby="humo-title"
      data-scene="humo-estatica"
      className="bg-ink-950 py-20 sm:py-28"
    >
      <Container>
        <StageHeading id="humo-title" hasDemo={hasDemo} {...sceneContent.smoke} />
        <ol className="mt-12 border-t border-gold-500/20">
          {products.map((product, index) => (
            <Reveal as="li" key={product.id} delay={index * 0.05}>
              <div className="group relative grid gap-x-6 gap-y-2 border-b border-gold-500/20 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline">
                <span className="font-display text-lg text-gold-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-500 uppercase">
                    {product.brand.name}
                  </p>
                  <h3 className="mt-1 text-4xl text-ivory-50 sm:text-5xl">
                    <Link
                      to={`/producto/${product.slug}`}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-gold-500"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-smoke-300">{productDetails(product)}</p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  {product.isDemo && <DemoBadge />}
                  <Price
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    className="text-sm text-ivory-50"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

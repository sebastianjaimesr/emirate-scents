import { m } from 'motion/react'
import { lazy, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { sceneContent } from '../../content/home'
import { useAsyncData } from '../../hooks/useAsyncData'
import { cx } from '../../lib/cx'
import type { OlfactoryNotes, Product } from '../../types/product'
import { getCollection, hasNotes } from '../scenes/collection'
import { familyColor } from '../scenes/familyPalette'
import { SceneSlot } from '../scenes/SceneSlot'
import { StageCounter, StageHeading } from '../scenes/StageParts'
import { isCompactScreen, useSceneMode } from '../scenes/useSceneMode'
import { stageHeight, useScrollStage } from '../scenes/useScrollStage'
import type { PyramidItem } from './PyramidScene'
import { tiers } from './tiers'

const PyramidScene = lazy(() => import('./PyramidScene'))

/** Cuántos perfumes recorre la pirámide. */
const MAX_ITEMS = 4

type ProductWithNotes = Product & { notes: OlfactoryNotes }

/**
 * "Pirámide olfativa". Solo aparece si hay perfumes con notas registradas en el catálogo.
 * Con 3D, las notas flotan en los tres pisos de una pirámide que gira al bajar la página.
 * Sin 3D, cada perfume muestra sus notas en tres filas.
 */
export function NotesPyramid() {
  const { data } = useAsyncData('coleccion', getCollection)
  const products = useMemo(
    () => (data?.filter(hasNotes) ?? []).slice(0, MAX_ITEMS) as ProductWithNotes[],
    [data],
  )
  const { mode, fallBack } = useSceneMode()

  if (products.length === 0) return null
  const hasDemo = products.some((product) => product.isDemo)
  return mode === '3d' && products.length > 1 ? (
    <PyramidStage products={products} hasDemo={hasDemo} onError={fallBack} />
  ) : (
    <PyramidList products={products} hasDemo={hasDemo} />
  )
}

function PyramidStage({
  products,
  hasDemo,
  onError,
}: {
  products: ProductWithNotes[]
  hasDemo: boolean
  onError: () => void
}) {
  const { sectionRef, progress, active } = useScrollStage(products.length)
  const [compact] = useState(isCompactScreen)
  const items = useMemo<PyramidItem[]>(
    () =>
      products.map((product) => ({
        id: product.id,
        notes: product.notes,
        color: familyColor(product.olfactoryFamily),
      })),
    [products],
  )
  const product = products[active]

  return (
    <section
      ref={sectionRef}
      aria-labelledby="piramide-title"
      data-scene="piramide"
      className="relative bg-ink-950"
      style={{ height: stageHeight(products.length, 60) }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_70%_50%,rgb(201_165_78/0.1),transparent_70%)] max-lg:bg-[radial-gradient(ellipse_70%_40%_at_50%_35%,rgb(201_165_78/0.1),transparent_70%)]"
        />
        <SceneSlot onError={onError}>
          {(callbacks) => (
            <PyramidScene items={items} progress={progress} compact={compact} {...callbacks} />
          )}
        </SceneSlot>

        <div className="pointer-events-none relative flex h-full flex-col pt-18 xl:pt-22">
          <Container className="flex flex-wrap items-end justify-between gap-6 pt-6 xl:pt-8">
            <StageHeading id="piramide-title" hasDemo={hasDemo} {...sceneContent.pyramid} />
            <StageCounter active={active} count={products.length} />
          </Container>
          <div className="flex-1" />
          <Container className="pb-8 lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-[35%] lg:pb-0">
            <p className="mb-6 hidden max-w-sm text-sm leading-relaxed text-smoke-300 lg:block">
              {sceneContent.pyramid.lead}
            </p>
            <NotesCard product={product} />
          </Container>
        </div>
      </div>
    </section>
  )
}

/** El perfume al frente y sus notas por piso, en texto (también para lectores de pantalla). */
function NotesCard({ product }: { product: ProductWithNotes }) {
  return (
    <div className="pointer-events-auto max-w-sm" aria-live="polite">
      <m.div
        key={product.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <ProductNotes product={product} />
      </m.div>
    </div>
  )
}

function ProductNotes({ product, className }: { product: ProductWithNotes; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {product.isDemo && <DemoBadge />}
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-500 uppercase">
          {product.brand.name}
          {product.olfactoryFamily && ` · ${product.olfactoryFamily}`}
        </p>
      </div>
      <h3 className="mt-2 text-3xl leading-tight text-ivory-50">
        <Link to={`/producto/${product.slug}`} className="hover:text-gold-300">
          {product.name}
        </Link>
      </h3>
      <dl className="mt-4 grid gap-2 text-sm">
        {tiers.map((tier) =>
          product.notes[tier.key].length > 0 ? (
            <div key={tier.key} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3">
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-smoke-300 uppercase">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}` }}
                />
                {tier.label}
              </dt>
              <dd className="text-ivory-50">{product.notes[tier.key].join(', ')}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
  )
}

/** Versión sin animación: cada perfume con sus notas en tres filas. */
function PyramidList({ products, hasDemo }: { products: ProductWithNotes[]; hasDemo: boolean }) {
  return (
    <section
      aria-labelledby="piramide-title"
      data-scene="piramide-estatica"
      className="bg-ink-950 py-20 sm:py-28"
    >
      <Container>
        <StageHeading id="piramide-title" hasDemo={hasDemo} {...sceneContent.pyramid} />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-smoke-300">
          {sceneContent.pyramid.lead}
        </p>
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {products.map((product, index) => (
            <Reveal
              as="li"
              key={product.id}
              delay={(index % 2) * 0.06}
              className={cx('border border-gold-500/25 p-6')}
            >
              <ProductNotes product={product} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}

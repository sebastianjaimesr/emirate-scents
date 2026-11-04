/**
 * Ficha de producto (/producto/:slug).
 */
import { ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DemoNotice } from '../components/products/DemoNotice'
import { Price } from '../components/products/Price'
import { ProductBadges } from '../components/products/ProductBadges'
import { ProductGrid } from '../components/products/ProductGrid'
import { Container } from '../components/ui/Container'
import { PageMeta } from '../components/ui/PageMeta'
import { Reveal } from '../components/ui/Reveal'
import { findCategory } from '../data/categories'
import { AvailabilityLabel } from '../features/product/AvailabilityLabel'
import { OlfactoryNotes } from '../features/product/OlfactoryNotes'
import { ProductGallery } from '../features/product/ProductGallery'
import { ProductPurchasePanel } from '../features/product/ProductPurchasePanel'
import { useAsyncData } from '../hooks/useAsyncData'
import { LoadError } from '../components/ui/LoadError'
import { getProductBySlug, getRelatedProducts } from '../services/productService'
import { audienceLabels, concentrationLabels, type Product } from '../types/product'
import { NotFoundPage } from './NotFoundPage'

/** Esqueleto animado de la ficha mientras carga el producto. */
function ProductPageSkeleton() {
  return (
    <Container
      className="grid animate-pulse gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16"
      aria-busy="true"
    >
      <div className="aspect-[4/5] bg-cream-100" />
      <div className="space-y-4 pt-4">
        <div className="h-3 w-1/4 bg-sand-300/60" />
        <div className="h-12 w-3/4 bg-sand-300/60" />
        <div className="h-5 w-1/3 bg-sand-300/60" />
        <div className="h-24 w-full bg-sand-300/40" />
      </div>
    </Container>
  )
}

/** Ruta de navegación (migas de pan): Inicio › Catálogo › Categoría › Producto. */
function Breadcrumbs({ product }: { product: Product }) {
  const category = findCategory(product.categorySlug)
  const crumbs = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/catalogo' },
    ...(category ? [{ label: category.shortName, to: `/catalogo/${category.slug}` }] : []),
  ]
  return (
    <nav aria-label="Ruta de navegación" className="text-xs text-smoke-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb) => (
          <li key={crumb.to} className="flex items-center gap-1.5">
            <Link to={crumb.to} className="hover:text-ink-950">
              {crumb.label}
            </Link>
            <ChevronRight aria-hidden="true" className="size-3" />
          </li>
        ))}
        <li aria-current="page" className="text-ink-900">
          {product.name}
        </li>
      </ol>
    </nav>
  )
}

/** Tabla de características del producto (marca, referencia, tamaño, concentración…). */
function ProductSpecs({ product }: { product: Product }) {
  const specs = [
    { label: 'Marca', value: product.brand.name },
    { label: 'Referencia', value: product.sku },
    { label: 'Tamaño', value: product.sizeMl && `${product.sizeMl} ml` },
    {
      label: 'Concentración',
      value: product.concentration && concentrationLabels[product.concentration],
    },
    { label: 'Familia olfativa', value: product.olfactoryFamily },
    { label: 'Para', value: product.audience && audienceLabels[product.audience] },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec.value))

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label}>
          <dt className="text-xs text-smoke-500">{spec.label}</dt>
          <dd className="mt-0.5 text-ink-950">{spec.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Título de las secciones de la ficha. */
function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-3xl text-ink-950">{children}</h2>
}

/**
 * Ficha de producto: fotos, precio, disponibilidad, cantidad, agregar al carrito, notas olfativas y productos relacionados.
 */
export function ProductPage() {
  const { slug = '' } = useParams()
  const productRequest = useAsyncData(`product:${slug}`, () => getProductBySlug(slug))
  const product = productRequest.data
  const related = useAsyncData(`related:${product?.slug ?? ''}`, () =>
    product ? getRelatedProducts(product) : Promise.resolve([]),
  )

  if (productRequest.isLoading) return <ProductPageSkeleton />
  if (productRequest.error) {
    return (
      <Container>
        <LoadError
          title="No pudimos cargar este producto"
          onRetry={productRequest.retry}
          headingLevel={1}
        />
      </Container>
    )
  }
  if (!product) return <NotFoundPage />

  const isEquivalence = product.categorySlug === 'equivalencias'

  return (
    <>
      <PageMeta
        title={`${product.name} · ${product.brand.name}`}
        description={`${product.shortDescription} ${product.sizeMl ? `${product.sizeMl} ml.` : ''} Pide por WhatsApp en Emirate Scents.`}
      />

      <Container className="py-8 lg:py-12">
        <Breadcrumbs product={product} />
        {product.isDemo && <DemoNotice className="mt-6" />}

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery key={product.id} product={product} />

          <div className="lg:pt-4">
            <ProductBadges product={product} />
            <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
              {product.brand.name}
            </p>
            <h1 className="mt-2 text-5xl leading-none text-ink-950 sm:text-6xl">{product.name}</h1>
            <p className="mt-4 text-base leading-relaxed text-smoke-500">
              {product.shortDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-sand-300 py-5">
              <Price
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                className="text-2xl text-ink-950"
              />
              <AvailabilityLabel stock={product.stock} />
            </div>

            {isEquivalence && (
              <p className="mt-6 border-l-2 border-gold-700 bg-cream-100 px-4 py-3 text-sm leading-relaxed text-ink-900">
                <strong className="font-semibold">Equivalencia.</strong>{' '}
                {product.inspirationReference && (
                  <>Inspirada en: {product.inspirationReference}. </>
                )}
                No es el perfume original ni está asociada a la marca que evoca.
              </p>
            )}

            <div className="mt-8">
              <ProductPurchasePanel key={product.id} product={product} />
            </div>

            <div className="mt-10">
              <ProductSpecs product={product} />
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionTitle>Descripción</SectionTitle>
            <p className="mt-5 text-base leading-relaxed whitespace-pre-line text-smoke-500">
              {product.description}
            </p>
          </Reveal>
          {product.notes && (
            <Reveal>
              <SectionTitle>Pirámide olfativa</SectionTitle>
              <div className="mt-5">
                <OlfactoryNotes notes={product.notes} />
              </div>
            </Reveal>
          )}
        </div>

        <Reveal className="mt-16 grid gap-8 bg-cream-100 p-6 sm:grid-cols-3 sm:p-10">
          <div>
            <h2 className="text-2xl text-ink-950">Entrega y pago</h2>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-smoke-500 sm:col-span-2">
            <p>
              <strong className="font-semibold text-ink-900">Pago contra entrega</strong>, sujeto a
              la cobertura y las condiciones de tu ciudad.
            </p>
            <p>
              El <strong className="font-semibold text-ink-900">costo y el tiempo de envío</strong>{' '}
              se confirman por WhatsApp antes de despachar, según tu ciudad y dirección.
            </p>
            <p>
              Tu pedido queda pendiente hasta que confirmemos contigo la disponibilidad y las
              condiciones de entrega.
            </p>
          </div>
        </Reveal>
      </Container>

      {related.data && related.data.length > 0 && (
        <section
          aria-labelledby="related-title"
          className="border-t border-sand-300 bg-ivory-50 py-20"
        >
          <Container>
            <h2 id="related-title" className="text-4xl text-ink-950">
              También te puede gustar
            </h2>
            <ProductGrid products={related.data} className="mt-10" />
          </Container>
        </section>
      )}
    </>
  )
}

import { ArrowRight } from 'lucide-react'
import { ProductGrid } from '../../components/products/ProductGrid'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Container } from '../../components/ui/Container'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { useAsyncData } from '../../hooks/useAsyncData'
import { cx } from '../../lib/cx'
import { getHighlightedProducts, type HighlightKind } from '../../services/productService'

interface ProductHighlightSectionProps {
  kind: HighlightKind
  eyebrow: string
  title: string
  lead: string
  catalogLink: string
  background?: string
}

/**
 * Sección de productos destacados en el inicio (recomendados, novedades, más vendidos).
 * Si no hay productos que cumplan el criterio, la sección NO se muestra:
 * nunca se rellena con productos que no correspondan.
 */
export function ProductHighlightSection({
  kind,
  eyebrow,
  title,
  lead,
  catalogLink,
  background = 'bg-ivory-50',
}: ProductHighlightSectionProps) {
  const { data: products } = useAsyncData(`highlight:${kind}`, () => getHighlightedProducts(kind))

  if (!products || products.length === 0) return null

  const headingId = `${kind}-title`
  return (
    <section aria-labelledby={headingId} className={cx('py-24 sm:py-32', background)}>
      <Container>
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading id={headingId} eyebrow={eyebrow} title={title} lead={lead} />
          <ButtonLink
            to={catalogLink}
            variant="outline-light"
            className="shrink-0 self-start md:self-auto"
          >
            Ver todo
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </ButtonLink>
        </div>
        {products.some((product) => product.isDemo) && (
          <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-ruby-600 uppercase">
            Productos de demostración: no están a la venta
          </p>
        )}
        <ProductGrid products={products} className="mt-12" />
      </Container>
    </section>
  )
}

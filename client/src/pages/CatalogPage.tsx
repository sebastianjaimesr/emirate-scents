import { SearchX } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { WhatsAppIcon } from '../components/brand/BrandIcons'
import { DemoNotice } from '../components/products/DemoNotice'
import { ProductGrid, ProductGridSkeleton } from '../components/products/ProductGrid'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { Drawer } from '../components/ui/Drawer'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadError } from '../components/ui/LoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { findCategory } from '../data/categories'
import { ActiveFilters } from '../features/catalog/ActiveFilters'
import { CatalogToolbar } from '../features/catalog/CatalogToolbar'
import { countActiveFilters, toSearchParams } from '../features/catalog/catalogQuery'
import { FiltersPanel } from '../features/catalog/FiltersPanel'
import { Pagination } from '../features/catalog/Pagination'
import { useCatalogQuery } from '../features/catalog/useCatalogQuery'
import { useAsyncData } from '../hooks/useAsyncData'
import { buildWhatsAppUrl, whatsappMessages } from '../lib/whatsapp'
import { getCatalogFilters, getProducts } from '../services/productService'
import { NotFoundPage } from './NotFoundPage'

export function CatalogPage() {
  const { categorySlug } = useParams()
  const category = findCategory(categorySlug)
  const { query, updateQuery, clearFilters } = useCatalogQuery()
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const requestKey = `${categorySlug ?? ''}?${toSearchParams(query)}`
  const results = useAsyncData(requestKey, () => getProducts(query))
  const facets = useAsyncData(categorySlug ?? 'all', () => getCatalogFilters(categorySlug))

  if (categorySlug && !category) return <NotFoundPage />

  // Mientras llegan los nuevos resultados se mantienen los anteriores (sin parpadeos)
  const page = results.data ?? results.previousData
  const activeFilterCount = countActiveFilters(query)
  const title = category?.name ?? 'Catálogo'
  const hasDemoProducts = page?.items.some((product) => product.isDemo) ?? false

  function goToPage(pageNumber: number) {
    updateQuery({ page: pageNumber })
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageMeta
        title={title}
        description={
          category?.description ??
          'Catálogo de perfumes árabes, de diseñador, de nicho y equivalencias de Emirate Scents.'
        }
      />
      <PageHeader eyebrow="Colecciones" title={title} lead={category?.description} />

      <Container className="py-10 sm:py-14">
        {hasDemoProducts && <DemoNotice className="mb-10" />}

        <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
          <aside aria-label="Filtros" className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto pr-2 pb-6">
              <FiltersPanel query={query} facets={facets.data} onChange={updateQuery} />
            </div>
          </aside>

          <div ref={resultsRef} className="min-w-0 scroll-mt-28">
            <CatalogToolbar
              key={query.search}
              query={query}
              total={results.error ? null : page?.total}
              activeFilterCount={activeFilterCount}
              onChange={updateQuery}
              onOpenFilters={() => setIsFiltersOpen(true)}
            />
            <ActiveFilters
              query={query}
              facets={facets.data}
              onChange={updateQuery}
              onClear={clearFilters}
            />

            <div className="mt-8" aria-busy={results.isLoading}>
              {results.error ? (
                <LoadError title="No pudimos cargar el catálogo" onRetry={results.retry} />
              ) : !page ? (
                <ProductGridSkeleton />
              ) : page.total === 0 ? (
                <EmptyState
                  icon={<SearchX className="size-8" strokeWidth={1.25} />}
                  title="Sin resultados"
                  description={
                    query.search
                      ? `No encontramos productos para "${query.search}" con estos filtros. Prueba con otros términos o pregúntanos por WhatsApp.`
                      : 'Ningún producto coincide con estos filtros. Prueba quitando alguno.'
                  }
                  actions={
                    <>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="min-h-12 border border-ink-900/30 px-7 text-sm font-semibold tracking-[0.08em] uppercase hover:border-ink-900"
                        >
                          Limpiar filtros
                        </button>
                      )}
                      <ButtonLink
                        to={buildWhatsAppUrl(
                          query.search
                            ? whatsappMessages.search(query.search)
                            : whatsappMessages.general,
                        )}
                      >
                        <WhatsAppIcon className="size-5" />
                        Preguntar por WhatsApp
                      </ButtonLink>
                    </>
                  }
                />
              ) : (
                <div
                  className={
                    results.isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'
                  }
                >
                  <ProductGrid products={page.items} priorityCount={4} />
                  <Pagination
                    page={page.page}
                    totalPages={page.totalPages}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {isFiltersOpen && (
          <Drawer
            ariaLabel="Filtros del catálogo"
            title={<span className="font-display text-2xl">Filtros</span>}
            onClose={() => setIsFiltersOpen(false)}
            className="lg:hidden"
            footer={
              <div className="flex gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="min-h-12 flex-1 border border-ink-900/30 text-xs font-semibold tracking-[0.12em] uppercase"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="min-h-12 flex-[2] bg-ink-900 text-xs font-semibold tracking-[0.12em] text-ivory-50 uppercase"
                >
                  {page
                    ? `Ver ${page.total} ${page.total === 1 ? 'resultado' : 'resultados'}`
                    : 'Ver resultados'}
                </button>
              </div>
            }
          >
            <div className="px-5 py-6">
              <FiltersPanel query={query} facets={facets.data} onChange={updateQuery} />
            </div>
          </Drawer>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Filtros aplicados en el catálogo, como chips que se pueden quitar.
 */
import { X } from 'lucide-react'
import { formatCOP } from '../../lib/formatCOP'
import { countActiveFilters, type CatalogFacets, type CatalogQuery } from './catalogQuery'

interface ActiveFiltersProps {
  query: CatalogQuery
  facets: CatalogFacets | undefined
  onChange: (changes: Partial<CatalogQuery>) => void
  onClear: () => void
}

/** Muestra los filtros aplicados como "chips" que se pueden quitar uno a uno. */
export function ActiveFilters({ query, facets, onChange, onClear }: ActiveFiltersProps) {
  if (countActiveFilters(query) === 0) return null

  const brandName = (slug: string) =>
    facets?.brands.find((brand) => brand.slug === slug)?.name ?? slug
  const chips = [
    query.search && { label: `"${query.search}"`, remove: () => onChange({ search: '' }) },
    ...query.brands.map((slug) => ({
      label: brandName(slug),
      remove: () => onChange({ brands: query.brands.filter((item) => item !== slug) }),
    })),
    ...query.sizes.map((size) => ({
      label: `${size} ml`,
      remove: () => onChange({ sizes: query.sizes.filter((item) => item !== size) }),
    })),
    ...query.families.map((family) => ({
      label: family,
      remove: () => onChange({ families: query.families.filter((item) => item !== family) }),
    })),
    query.minPrice !== undefined && {
      label: `Desde ${formatCOP(query.minPrice)}`,
      remove: () => onChange({ minPrice: undefined }),
    },
    query.maxPrice !== undefined && {
      label: `Hasta ${formatCOP(query.maxPrice)}`,
      remove: () => onChange({ maxPrice: undefined }),
    },
  ].filter((chip) => chip !== false && chip !== '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.remove}
          aria-label={`Quitar filtro ${chip.label}`}
          className="inline-flex min-h-9 items-center gap-2 border border-ink-900/20 bg-cream-100 px-3 text-xs text-ink-900 transition-colors hover:border-ink-900"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="min-h-9 px-2 text-xs font-semibold tracking-[0.12em] text-gold-700 uppercase underline-offset-4 hover:underline"
      >
        Limpiar filtros
      </button>
    </div>
  )
}

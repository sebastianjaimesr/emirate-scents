import { Search, SlidersHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { sortOptions, type CatalogQuery, type SortOption } from './catalogQuery'

interface CatalogToolbarProps {
  query: CatalogQuery
  total: number | undefined
  activeFilterCount: number
  onChange: (changes: Partial<CatalogQuery>) => void
  onOpenFilters: () => void
}

/** Búsqueda, número de resultados, orden y botón de filtros (móvil). */
export function CatalogToolbar({
  query,
  total,
  activeFilterCount,
  onChange,
  onOpenFilters,
}: CatalogToolbarProps) {
  const [search, setSearch] = useState(query.search)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onChange({ search: search.trim() })
  }

  return (
    <div className="space-y-4">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-b border-ink-900/30 focus-within:border-ink-900"
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-gold-700" strokeWidth={1.5} />
        <label htmlFor="catalog-search" className="sr-only">
          Buscar en el catálogo por nombre, marca o nota
        </label>
        <input
          id="catalog-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, marca o nota (oud, rosa...)"
          enterKeyHint="search"
          className="min-h-12 w-full bg-transparent text-base placeholder:text-smoke-500/70 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 px-2 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-smoke-500">
          {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'producto' : 'productos'}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-ink-900/25 px-3 text-xs font-semibold tracking-[0.12em] uppercase sm:flex-none lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-ink-900 text-[0.65rem] text-ivory-50">
                {activeFilterCount}
              </span>
            )}
          </button>
          <label className="sr-only" htmlFor="catalog-sort">
            Ordenar por
          </label>
          <select
            id="catalog-sort"
            value={query.sort}
            onChange={(event) => onChange({ sort: event.target.value as SortOption })}
            className="min-h-11 min-w-0 flex-1 cursor-pointer border border-ink-900/25 bg-transparent px-3 text-xs font-semibold tracking-[0.06em] focus:border-ink-900 focus:outline-none sm:flex-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

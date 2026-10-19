/**
 * Panel de filtros del catálogo: marcas, tamaños, familias olfativas y precio.
 */
import { Check } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { categories } from '../../data/categories'
import { formatCOP } from '../../lib/formatCOP'
import type { CatalogFacets, CatalogQuery } from './catalogQuery'
import { toggleValue } from './useCatalogQuery'

interface FiltersPanelProps {
  query: CatalogQuery
  facets: CatalogFacets | undefined
  onChange: (changes: Partial<CatalogQuery>) => void
}

/** Grupo de filtros con su título (fieldset + legend para accesibilidad). */
function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-sand-300 py-6 first:pt-0">
      <legend className="eyebrow float-left mb-4 w-full text-ink-900">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

/** Opción de filtro con casilla y cantidad de productos. */
function CheckboxOption({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="group flex min-h-10 cursor-pointer items-center gap-3 text-sm text-ink-900">
      <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
      <span className="grid size-5 shrink-0 place-items-center border border-ink-900/40 transition-colors group-hover:border-ink-900 peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-500">
        {checked && (
          <Check aria-hidden="true" className="size-3.5 text-ivory-50" strokeWidth={2.5} />
        )}
      </span>
      <span className="flex-1">{label}</span>
      <span className="text-xs text-smoke-500 tabular-nums">{count}</span>
    </label>
  )
}

/** Filtro de precio mínimo y máximo; se aplica al presionar "Aplicar". */
function PriceFilter({ query, facets, onChange }: FiltersPanelProps) {
  // Estado local: el filtro se aplica al pulsar "Aplicar", no con cada tecla
  const [min, setMin] = useState(query.minPrice?.toString() ?? '')
  const [max, setMax] = useState(query.maxPrice?.toString() ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const toNumber = (value: string) =>
      value.trim() === '' ? undefined : Math.max(0, Math.round(Number(value)))
    let minPrice = toNumber(min)
    let maxPrice = toNumber(max)
    // Si el usuario los escribe al revés, los intercambiamos
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
      [minPrice, maxPrice] = [maxPrice, minPrice]
    onChange({ minPrice, maxPrice })
  }

  const inputClass =
    'min-h-11 w-full border border-ink-900/25 bg-transparent px-3 text-sm tabular-nums focus:border-ink-900 focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {facets?.priceRange && (
        <p className="text-xs text-smoke-500">
          Entre {formatCOP(facets.priceRange.min)} y {formatCOP(facets.priceRange.max)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-smoke-500">
          Mínimo (COP)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="0"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-xs text-smoke-500">
          Máximo (COP)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Sin límite"
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      <button
        type="submit"
        className="min-h-11 w-full border border-ink-900 text-xs font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-ink-900 hover:text-ivory-50"
      >
        Aplicar precio
      </button>
    </form>
  )
}

/** Contenido de los filtros: se usa en la barra lateral (escritorio) y en el panel (móvil). */
export function FiltersPanel({ query, facets, onChange }: FiltersPanelProps) {
  return (
    <div>
      <FilterGroup title="Categoría">
        <ul className="space-y-0.5 text-sm">
          {[{ slug: '', name: 'Todo el catálogo' }, ...categories].map((category) => (
            <li key={category.slug}>
              <NavLink
                to={category.slug ? `/catalogo/${category.slug}` : '/catalogo'}
                end
                className={({ isActive }) =>
                  `flex min-h-10 items-center transition-colors hover:text-gold-700 ${isActive ? 'font-semibold text-gold-700' : 'text-ink-900'}`
                }
              >
                {category.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {facets && facets.brands.length > 0 && (
        <FilterGroup title="Marca">
          {facets.brands.map((brand) => (
            <CheckboxOption
              key={brand.slug}
              label={brand.name}
              count={brand.count}
              checked={query.brands.includes(brand.slug)}
              onToggle={() => onChange({ brands: toggleValue(query.brands, brand.slug) })}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Precio">
        {/* key: si los precios cambian desde fuera (p. ej. "Limpiar"), el formulario se reinicia */}
        <PriceFilter
          key={`${query.minPrice}-${query.maxPrice}`}
          query={query}
          facets={facets}
          onChange={onChange}
        />
      </FilterGroup>

      {facets && facets.sizes.length > 0 && (
        <FilterGroup title="Tamaño">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const isActive = query.sizes.includes(size.value)
              return (
                <button
                  key={size.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChange({ sizes: toggleValue(query.sizes, size.value) })}
                  className={`min-h-10 min-w-16 border px-3 text-sm tabular-nums transition-colors ${
                    isActive
                      ? 'border-ink-900 bg-ink-900 text-ivory-50'
                      : 'border-ink-900/25 hover:border-ink-900'
                  }`}
                >
                  {size.value} ml
                </button>
              )
            })}
          </div>
        </FilterGroup>
      )}

      {facets && facets.families.length > 0 && (
        <FilterGroup title="Familia olfativa">
          {facets.families.map((family) => (
            <CheckboxOption
              key={family.value}
              label={family.value}
              count={family.count}
              checked={query.families.includes(family.value)}
              onToggle={() => onChange({ families: toggleValue(query.families, family.value) })}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  )
}

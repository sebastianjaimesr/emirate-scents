import { useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { parseCatalogQuery, toSearchParams, type CatalogQuery } from './catalogQuery'

/**
 * Los filtros del catálogo viven en la URL (?marca=...&orden=...).
 * Ventajas: se pueden compartir por enlace, el botón "atrás" funciona y
 * al recargar la página se conservan.
 */
export function useCatalogQuery() {
  const { categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo(
    () => parseCatalogQuery(searchParams, categorySlug),
    [searchParams, categorySlug],
  )

  /** Cambia uno o varios filtros. Cualquier cambio (salvo de página) vuelve a la página 1. */
  const updateQuery = useCallback(
    (changes: Partial<CatalogQuery>) => {
      const next: CatalogQuery = { ...query, page: 1, ...changes }
      setSearchParams(toSearchParams(next), { preventScrollReset: true })
    },
    [query, setSearchParams],
  )

  const clearFilters = useCallback(
    () => setSearchParams(new URLSearchParams(), { preventScrollReset: true }),
    [setSearchParams],
  )

  return { query, updateQuery, clearFilters }
}

/** Añade o quita un valor de una lista (para casillas de verificación). */
export function toggleValue<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

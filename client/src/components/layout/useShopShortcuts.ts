import { useEffect, useState } from 'react'
import { audienceOptions, collectionOptions } from '../../features/catalog/catalogQuery'
import { getCatalogFilters } from '../../services/productService'

export interface ShopShortcut {
  label: string
  to: string
}

/** Se pide una sola vez por visita: lo comparten el menú móvil y el pie de página. */
let shortcutsPromise: Promise<ShopShortcut[]> | undefined

function loadShortcuts() {
  shortcutsPromise ??= getCatalogFilters().then(
    (facets) => [
      ...facets.audiences.map(({ value }) => ({
        label: audienceOptions.find((option) => option.value === value)!.label,
        to: `/catalogo?genero=${value}`,
      })),
      ...facets.collections.map(({ value }) => ({
        label: collectionOptions.find((option) => option.value === value)!.label,
        to: `/catalogo?coleccion=${value}`,
      })),
    ],
    // Si la API no responde, simplemente no se muestran los accesos (el resto del menú funciona)
    () => [],
  )
  return shortcutsPromise
}

/**
 * Accesos "Hombres, Mujeres, Unisex, Nuevos lanzamientos, Más vendidos, Ofertas".
 * Solo aparecen los que tienen productos con ese dato REAL: así nunca hay un enlace
 * que lleve a una página vacía. Hoy el catálogo no tiene esos datos y la lista queda vacía.
 */
export function useShopShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShopShortcut[]>([])
  useEffect(() => {
    let active = true
    void loadShortcuts().then((items) => active && setShortcuts(items))
    return () => {
      active = false
    }
  }, [])
  return shortcuts
}

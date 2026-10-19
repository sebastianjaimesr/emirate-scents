/**
 * Estado global de favoritos con Zustand, guardado en el navegador.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface FavoritesState {
  /** Ids de los productos favoritos, del más reciente al más antiguo. */
  productIds: string[]
  toggle: (productId: string) => void
  remove: (productId: string) => void
}

/**
 * Favoritos guardados en el navegador.
 * Cuando existan cuentas de usuario, esta lista se podrá enviar al servidor
 * (tabla Favorite) sin cambiar los componentes que la usan.
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [productId, ...state.productIds],
        })),
      remove: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
    }),
    {
      name: 'emirate-scents:favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const raw = (persisted as { productIds?: unknown })?.productIds
        const productIds = Array.isArray(raw)
          ? [...new Set(raw.filter((id) => typeof id === 'string'))]
          : []
        return { ...current, productIds }
      },
    },
  ),
)

/** Hook de conveniencia: ¿este producto es favorito? (solo re-renderiza si cambia ese dato) */
export function useIsFavorite(productId: string) {
  return useFavoritesStore((state) => state.productIds.includes(productId))
}

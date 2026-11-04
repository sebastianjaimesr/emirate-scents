/**
 * Estado global del carrito con Zustand, guardado en el navegador (localStorage).
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { addItem, removeItem, setItemQuantity, type CartItem } from './cartItems'

interface CartState {
  items: CartItem[]
  /** Si el panel lateral del carrito está abierto (no se guarda en el navegador). */
  isDrawerOpen: boolean
  addItem: (productId: string, quantity: number, stock: number) => void
  setQuantity: (productId: string, quantity: number, stock: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

/**
 * Estado global del carrito con Zustand.
 * `persist` lo guarda en localStorage para recuperarlo al recargar la página.
 * Solo se guardan ids y cantidades (ver cartItems.ts).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      addItem: (productId, quantity, stock) =>
        set((state) => ({ items: addItem(state.items, productId, quantity, stock) })),
      setQuantity: (productId, quantity, stock) =>
        set((state) => ({ items: setItemQuantity(state.items, productId, quantity, stock) })),
      removeItem: (productId) => set((state) => ({ items: removeItem(state.items, productId) })),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'emirate-scents:cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Si alguien edita localStorage a mano, descartamos lo que no tenga la forma correcta
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown })?.items
        const items = Array.isArray(raw)
          ? raw.filter(
              (item): item is CartItem =>
                typeof item?.productId === 'string' &&
                Number.isInteger(item?.quantity) &&
                item.quantity > 0,
            )
          : []
        return { ...current, items }
      },
    },
  ),
)

import { useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getProductsByIds } from '../../services/productService'
import { buildCartLines } from './cartItems'
import { useCartStore } from './cartStore'

/** Artículos del carrito unidos a sus datos actuales del catálogo (precio, inventario...). */
export function useCartDetails() {
  const items = useCartStore((state) => state.items)
  // Solo se vuelve a pedir el catálogo cuando cambian los productos, no las cantidades
  const idsKey = items.map((item) => item.productId).join(',')
  const products = useAsyncData(`cart:${idsKey}`, () =>
    getProductsByIds(items.map((item) => item.productId)),
  )
  const loadedProducts = products.data ?? products.previousData

  const details = useMemo(
    () => buildCartLines(items, loadedProducts ?? []),
    [items, loadedProducts],
  )
  return { ...details, isLoading: !loadedProducts && items.length > 0, isEmpty: items.length === 0 }
}

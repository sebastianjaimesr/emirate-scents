import { useEffect, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getProductsByIds } from '../../services/productService'
import { buildCartLines } from './cartItems'
import { useCartStore } from './cartStore'

/** Artículos del carrito unidos a sus datos actuales del catálogo (precio, inventario...). */
export function useCartDetails() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  // Solo se vuelve a pedir el catálogo cuando cambian los productos, no las cantidades
  const idsKey = items.map((item) => item.productId).join(',')
  const products = useAsyncData(`cart:${idsKey}`, () =>
    getProductsByIds(items.map((item) => item.productId)),
  )
  const loadedProducts = products.data ?? products.previousData

  // Si un producto guardado ya no está en el catálogo (retirado o despublicado), se quita
  // del carrito para que el contador del header coincida con lo que se ve.
  // Solo con una respuesta correcta del servidor: un error de red nunca borra nada.
  useEffect(() => {
    if (!products.data) return
    const available = new Set(products.data.map((product) => product.id))
    for (const id of idsKey.split(',')) {
      if (id && !available.has(id)) removeItem(id)
    }
  }, [products.data, idsKey, removeItem])

  const details = useMemo(
    () => buildCartLines(items, loadedProducts ?? []),
    [items, loadedProducts],
  )
  return {
    ...details,
    isLoading: !loadedProducts && !products.error && items.length > 0,
    loadError: !loadedProducts && products.error ? products.retry : undefined,
    /** Vuelve a pedir precios y existencias (por ejemplo, si el servidor rechazó el pedido). */
    refresh: products.retry,
    isEmpty: items.length === 0,
  }
}

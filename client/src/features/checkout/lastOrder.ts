import type { OrderConfirmation } from '../../types/order'

/*
  Último pedido registrado en esta pestaña, para que la página de confirmación siga
  mostrándolo si el cliente recarga. Se guarda en sessionStorage: desaparece al cerrar
  la pestaña y nunca sale del navegador.
*/

const STORAGE_KEY = 'emirate-scents:last-order'

/** Último pedido creado, para mostrar la página de confirmación. */
export interface LastOrder {
  order: OrderConfirmation
  /** Datos de entrega que escribió el cliente (la API no los devuelve). */
  delivery: { address: string; notes?: string }
}

/** Guarda el último pedido en sessionStorage (dura mientras la pestaña esté abierta). */
export function saveLastOrder(lastOrder: LastOrder) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lastOrder))
  } catch {
    // Navegación privada o almacenamiento lleno: la confirmación igual se muestra esta vez
  }
}

/** Lee el último pedido guardado; null si no hay o si los datos no son válidos. */
export function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastOrder
    return typeof parsed?.order?.orderNumber === 'string' && Array.isArray(parsed.order.items)
      ? parsed
      : null
  } catch {
    return null
  }
}

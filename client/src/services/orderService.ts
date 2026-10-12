import type { OrderConfirmation, OrderRequest } from '../types/order'
import { ApiError, apiPost } from './apiClient'

/**
 * Registra el pedido. El servidor solo usa los ids y las cantidades: recalcula precios,
 * comprueba existencias y devuelve el resumen definitivo con el número de pedido.
 */
export function createOrder(order: OrderRequest) {
  // La vista previa de GitHub Pages no tiene servidor: no registra pedidos
  if (import.meta.env.VITE_PREVIEW === 'true') {
    return Promise.reject(
      new ApiError(503, 'Esta es una vista previa: los pedidos todavía no están activos.'),
    )
  }
  return apiPost<OrderConfirmation>('/orders', order)
}

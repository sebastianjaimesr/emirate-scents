import type { OrderConfirmation, OrderRequest } from '../types/order'
import { apiPost } from './apiClient'

/**
 * Registra el pedido. El servidor solo usa los ids y las cantidades: recalcula precios,
 * comprueba existencias y devuelve el resumen definitivo con el número de pedido.
 */
export function createOrder(order: OrderRequest) {
  return apiPost<OrderConfirmation>('/orders', order)
}

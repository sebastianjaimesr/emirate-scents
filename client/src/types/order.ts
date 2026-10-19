/** Contrato con la API de pedidos (POST /api/orders). */

export type PaymentMethod = 'CONTRA_ENTREGA' | 'ACORDAR_POR_WHATSAPP'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CONTRA_ENTREGA: 'Pago contra entrega',
  ACORDAR_POR_WHATSAPP: 'Acordar por WhatsApp',
}

/** Datos de entrega del cliente. */
export interface OrderCustomer {
  name: string
  phone: string
  department: string
  city: string
  address: string
  notes?: string
}

/** Pedido que se envía a la API. */
export interface OrderRequest {
  customer: OrderCustomer
  paymentMethod: PaymentMethod
  items: { productId: string; quantity: number }[]
  dataConsent: true
  /** Campo trampa para robots: siempre vacío. */
  website?: string
}

/** Respuesta del servidor: precios y totales calculados con la base de datos. */
export interface OrderConfirmation {
  orderNumber: string
  status: 'PENDIENTE_CONFIRMACION'
  createdAt: string
  paymentMethod: PaymentMethod
  customer: { name: string; department: string; city: string }
  items: {
    productId: string | null
    name: string
    brandName: string
    sku: string
    sizeMl?: number
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
  subtotal: number
  shippingCost: number | null
  total: number
}

/** Por qué un producto del carrito no se puede comprar. */
export type UnavailableReason = 'NOT_FOUND' | 'DEMO_PRODUCT' | 'SOLD_OUT' | 'INSUFFICIENT_STOCK'

/** Producto no disponible al crear el pedido, con el motivo y las unidades disponibles. */
export interface UnavailableItem {
  productId: string
  reason: UnavailableReason
  available?: number
}

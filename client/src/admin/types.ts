/* Tipos de lo que devuelve la API del panel (server/src/services/admin). */

import type { PaymentMethod } from '../types/order'

/** Estado de publicación de un producto. */
export type ProductStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
/** Tipo de movimiento de inventario. */
export type MovementType = 'ENTRADA' | 'AJUSTE' | 'VENTA' | 'DEVOLUCION'
/** Estados por los que pasa un pedido, desde que se crea hasta que se entrega o cancela. */
export type OrderStatus =
  'PENDIENTE_CONFIRMACION' | 'CONFIRMADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'
/** Concentración del perfume (Extrait, Parfum, EDP, EDT, EDC, aceite u otra). */
export type Concentration = 'EXTRAIT' | 'PARFUM' | 'EDP' | 'EDT' | 'EDC' | 'ACEITE' | 'OTRA'
/** Público al que va dirigido el perfume. */
export type Audience = 'FEMENINO' | 'MASCULINO' | 'UNISEX'

/** Foto de un producto con sus anchos disponibles (para imágenes responsive). */
export interface AdminImage {
  id: string
  url: string
  alt: string
  position: number
  widths: number[]
}

/** Producto completo tal como lo devuelve la API del panel. */
export interface AdminProduct {
  id: string
  sku: string
  slug: string
  name: string
  brand: { id: string; slug: string; name: string }
  category: { id: string; slug: string; name: string }
  shortDescription: string
  description: string
  price: number
  compareAtPrice: number | null
  sizeMl: number | null
  concentration: Concentration | null
  olfactoryFamily: string | null
  notesTop: string[]
  notesHeart: string[]
  notesBase: string[]
  audience: Audience | null
  inspirationReference: string | null
  stock: number
  lowStockThreshold: number
  isLowStock: boolean
  status: ProductStatus
  isNew: boolean
  isFeatured: boolean
  isBestSeller: boolean
  isDemo: boolean
  images: AdminImage[]
  orderCount: number
  movementCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Respuesta paginada genérica de la API. */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Movimiento de inventario (entrada, ajuste, venta o devolución) con el stock resultante. */
export interface Movement {
  id: string
  product: { id: string; sku: string; name: string }
  type: MovementType
  quantity: number
  stockAfter: number
  reason: string
  adminName: string | null
  orderId: string | null
  orderNumber: number | null
  createdAt: string
}

/** Categoría con la cantidad de productos que tiene. */
export interface Category {
  id: string
  slug: string
  name: string
  position: number
  productCount: number
}

/** Marca con la cantidad de productos que tiene. */
export interface Brand {
  id: string
  slug: string
  name: string
  productCount: number
}

/** Datos del resumen del panel: productos por estado, stock bajo, pedidos y ventas. */
export interface Dashboard {
  generatedAt: string
  products: {
    byStatus: Partial<Record<ProductStatus, number>>
    lowStockCount: number
    outOfStockCount: number
    lowStock: { id: string; sku: string; name: string; stock: number; lowStockThreshold: number }[]
  }
  orders: {
    byStatus: Partial<Record<OrderStatus, number>>
    pendingCount: number
    recent: {
      id: string
      orderNumber: string
      status: OrderStatus
      customerName: string
      city: string
      total: number
      createdAt: string
    }[]
    confirmedLast30Days: { count: number; total: number }
  }
  recentMovements: Movement[]
}

/** Pedido resumido para la lista de pedidos. */
export interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  customerName: string
  customerPhone: string
  city: string
  department: string
  paymentMethod: PaymentMethod
  units: number
  subtotal: number
  shippingCost: number | null
  total: number
  createdAt: string
}

/** Página de pedidos con el conteo por estado (para las pestañas). */
export interface OrdersPage extends Page<OrderSummary> {
  countsByStatus: Partial<Record<OrderStatus, number>>
}

/** Pedido completo con cliente, líneas, totales e historial; incluye a qué estados puede pasar. */
export interface AdminOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  allowedTransitions: OrderStatus[]
  shippingEditable: boolean
  customer: {
    name: string
    phone: string
    department: string
    city: string
    address: string
    notes: string | null
  }
  paymentMethod: PaymentMethod
  items: {
    id: string
    name: string
    brandName: string
    sku: string
    sizeMl: number | null
    unitPrice: number
    quantity: number
    lineTotal: number
    product: { id: string; sku: string; name: string; stock: number; status: ProductStatus } | null
  }[]
  subtotal: number
  shippingCost: number | null
  total: number
  stockDeductedAt: string | null
  dataConsentAt: string
  privacyPolicyVersion: string
  history: {
    id: string
    fromStatus: OrderStatus
    toStatus: OrderStatus
    note: string | null
    adminName: string | null
    createdAt: string
  }[]
  movements: Movement[]
  createdAt: string
  updatedAt: string
}

export const statusLabels: Record<ProductStatus, string> = {
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  ARCHIVADO: 'Archivado',
}

export const movementLabels: Record<MovementType, string> = {
  ENTRADA: 'Entrada',
  AJUSTE: 'Ajuste',
  VENTA: 'Venta',
  DEVOLUCION: 'Devolución',
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmar',
  CONFIRMADO: 'Confirmado',
  EN_PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export const orderStatusTone = {
  PENDIENTE_CONFIRMACION: 'warning',
  CONFIRMADO: 'info',
  EN_PREPARACION: 'info',
  ENVIADO: 'info',
  ENTREGADO: 'success',
  CANCELADO: 'neutral',
} as const satisfies Record<OrderStatus, string>

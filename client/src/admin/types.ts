/* Tipos de lo que devuelve la API del panel (server/src/services/admin). */

export type ProductStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
export type MovementType = 'ENTRADA' | 'AJUSTE' | 'VENTA' | 'DEVOLUCION'
export type OrderStatus =
  'PENDIENTE_CONFIRMACION' | 'CONFIRMADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'
export type Concentration = 'EXTRAIT' | 'PARFUM' | 'EDP' | 'EDT' | 'EDC' | 'ACEITE' | 'OTRA'
export type Audience = 'FEMENINO' | 'MASCULINO' | 'UNISEX'

export interface AdminImage {
  id: string
  url: string
  alt: string
  position: number
  widths: number[]
}

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

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Movement {
  id: string
  product: { id: string; sku: string; name: string }
  type: MovementType
  quantity: number
  stockAfter: number
  reason: string
  adminName: string | null
  orderNumber: number | null
  createdAt: string
}

export interface Category {
  id: string
  slug: string
  name: string
  position: number
  productCount: number
}

export interface Brand {
  id: string
  slug: string
  name: string
  productCount: number
}

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

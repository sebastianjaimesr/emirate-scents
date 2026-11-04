import type { Product } from '../../types/product'

/*
  Reglas del carrito como funciones puras (fáciles de probar).
  El carrito guarda SOLO el id del producto y la cantidad. El precio NUNCA se guarda:
  siempre se lee del catálogo, así nadie puede alterarlo editando el navegador.
  (Aun así, en la Fase 6 el servidor recalculará todo antes de registrar un pedido.)
*/

export interface CartItem {
  productId: string
  quantity: number
}

/** Límite por producto para evitar pedidos accidentales enormes. */
export const MAX_QUANTITY_PER_ITEM = 10

/** Cantidad válida: entero entre 1 y el máximo permitido (y el inventario si se conoce). */
export function clampQuantity(quantity: number, stock = MAX_QUANTITY_PER_ITEM) {
  const max = Math.max(0, Math.min(MAX_QUANTITY_PER_ITEM, Math.floor(stock)))
  if (!Number.isFinite(quantity)) return Math.min(1, max)
  return Math.min(max, Math.max(1, Math.floor(quantity)))
}

/**
 * Agrega un producto al carrito (o suma cantidad si ya estaba), sin pasar del stock ni del máximo por producto.
 */
export function addItem(
  items: CartItem[],
  productId: string,
  quantity: number,
  stock?: number,
): CartItem[] {
  const existing = items.find((item) => item.productId === productId)
  if (!existing) {
    const safeQuantity = clampQuantity(quantity, stock)
    return safeQuantity > 0 ? [...items, { productId, quantity: safeQuantity }] : items
  }
  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: clampQuantity(item.quantity + quantity, stock) }
      : item,
  )
}

/** Cambia la cantidad de un producto; 0 o menos lo quita del carrito. */
export function setItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
  stock?: number,
): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId)
  return items.map((item) =>
    item.productId === productId ? { ...item, quantity: clampQuantity(quantity, stock) } : item,
  )
}

/** Quita un producto del carrito. */
export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.productId !== productId)
}

/** Cantidad total de unidades en el carrito. */
export function countItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

/** Estado de una línea del carrito: normal, agotado o con la cantidad reducida por falta de stock. */
export type CartLineStatus = 'ok' | 'sold-out' | 'reduced'

/** Línea del carrito con el producto, la cantidad efectiva y su total. */
export interface CartLine {
  product: Product
  /** Cantidad efectiva (ajustada al inventario disponible). */
  quantity: number
  requestedQuantity: number
  lineTotal: number
  status: CartLineStatus
}

/**
 * Une los artículos guardados con los datos actuales del catálogo.
 * - Productos que ya no existen: se descartan.
 * - Agotados: se marcan y no suman al subtotal.
 * - Cantidad mayor al inventario: se reduce y se avisa.
 * Los importes son enteros en pesos, así que la suma es exacta.
 */
export function buildCartLines(items: CartItem[], products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product]))
  const lines: CartLine[] = []

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product) continue
    const available = product.stock > 0 ? clampQuantity(item.quantity, product.stock) : 0
    const status: CartLineStatus =
      product.stock <= 0 ? 'sold-out' : available < item.quantity ? 'reduced' : 'ok'
    lines.push({
      product,
      quantity: available,
      requestedQuantity: item.quantity,
      lineTotal: product.price * available,
      status,
    })
  }

  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0)
  const hasDemoProducts = lines.some((line) => line.product.isDemo)
  const hasSoldOut = lines.some((line) => line.status === 'sold-out')
  return { lines, subtotal, hasDemoProducts, hasSoldOut }
}

/** Por qué no se puede continuar con el pedido, o null si se puede. */
export function getCartBlockingReason(hasDemoProducts: boolean, hasSoldOut: boolean) {
  return hasDemoProducts
    ? 'Tu carrito tiene productos DEMO, que no están a la venta. Retíralos para enviar un pedido real.'
    : hasSoldOut
      ? 'Retira los productos agotados para continuar.'
      : null
}

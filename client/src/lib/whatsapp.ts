import { brand } from '../config/brand'
import type { CartLine } from '../features/cart/cartItems'
import type { OrderConfirmation } from '../types/order'
import { paymentMethodLabels } from '../types/order'
import type { Product } from '../types/product'
import { formatCOP } from './formatCOP'

/**
 * Construye un enlace de WhatsApp (wa.me) hacia el número del negocio.
 * Si se pasa un mensaje, se añade codificado para que tildes, saltos de línea
 * y símbolos como "&" o "#" lleguen intactos.
 *
 * Importante: el enlace solo abre WhatsApp con el texto escrito.
 * El cliente es quien pulsa "Enviar"; nunca se envía nada automáticamente.
 */
export function buildWhatsAppUrl(message?: string, phoneNumber: string = brand.whatsappNumber) {
  if (!/^\d{8,15}$/.test(phoneNumber)) {
    throw new Error('El número de WhatsApp debe tener solo dígitos en formato internacional.')
  }

  const baseUrl = `https://wa.me/${phoneNumber}`
  const text = message?.trim()

  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl
}

/** Mensajes de inicio de conversación que se reutilizan en varios botones. */
export const whatsappMessages = {
  general: `Hola, ${brand.name}. Quiero recibir asesoría sobre sus perfumes.`,
  category: (categoryName: string) =>
    `Hola, ${brand.name}. Quiero conocer los ${categoryName.toLowerCase()} disponibles y sus precios.`,
  search: (query: string) =>
    `Hola, ${brand.name}. Estoy buscando "${query}". ¿Lo tienen disponible?`,
}

/** Mensaje para consultar o pedir un producto concreto desde su página de detalle. */
export function buildProductInquiryMessage(product: Product, quantity: number) {
  const lines = [
    `Hola, ${brand.name}. Quiero consultar este perfume:`,
    '',
    `• Producto: ${product.name}`,
    `• Marca: ${product.brand.name}`,
    product.sizeMl ? `• Tamaño: ${product.sizeMl} ml` : null,
    `• Referencia: ${product.sku}`,
    `• Cantidad: ${quantity}`,
    `• Precio unitario: ${formatCOP(product.price)}`,
    '',
    '¿Me pueden confirmar la disponibilidad y las condiciones de entrega?',
  ]
  return lines.filter((line) => line !== null).join('\n')
}

/**
 * Consulta con el contenido del carrito. El total es ESTIMADO: el envío se cotiza
 * y el negocio confirma precios y disponibilidad antes de despachar.
 */
export function buildCartInquiryMessage(lines: CartLine[], subtotal: number) {
  const items = lines
    .filter((line) => line.quantity > 0)
    .flatMap((line) => [
      `• ${line.product.name} (${line.product.brand.name}${line.product.sizeMl ? `, ${line.product.sizeMl} ml` : ''})`,
      `  Cantidad: ${line.quantity} · Precio unitario: ${formatCOP(line.product.price)}`,
    ])
  return [
    `Hola, ${brand.name}. Quiero consultar el siguiente pedido:`,
    '',
    ...items,
    '',
    `Subtotal estimado: ${formatCOP(subtotal)}`,
    'Envío: pendiente de cotización',
    '',
    '¿Me pueden confirmar la disponibilidad y las condiciones de entrega?',
  ].join('\n')
}

/**
 * Mensaje para confirmar un pedido ya registrado. Usa los importes que calculó el
 * servidor y añade la dirección que el cliente escribió (no viaja de vuelta desde la API).
 */
export function buildOrderMessage(
  order: OrderConfirmation,
  delivery: { address: string; notes?: string },
) {
  const items = order.items.flatMap((item) => [
    `• ${item.name} (${item.brandName}${item.sizeMl ? `, ${item.sizeMl} ml` : ''})`,
    `  Ref. ${item.sku} · Cantidad: ${item.quantity} · ${formatCOP(item.lineTotal)}`,
  ])
  return [
    `Hola, ${brand.name}. Acabo de registrar el pedido ${order.orderNumber}:`,
    '',
    ...items,
    '',
    `Subtotal: ${formatCOP(order.subtotal)}`,
    order.shippingCost === null
      ? 'Envío: pendiente de cotización'
      : `Envío: ${formatCOP(order.shippingCost)}`,
    `Total estimado: ${formatCOP(order.total)}`,
    `Forma de pago: ${paymentMethodLabels[order.paymentMethod]}`,
    '',
    `Nombre: ${order.customer.name}`,
    `Entrega: ${delivery.address}, ${order.customer.city} (${order.customer.department})`,
    delivery.notes ? `Observaciones: ${delivery.notes}` : null,
    '',
    '¿Me confirman la disponibilidad, el costo de envío y el pago?',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

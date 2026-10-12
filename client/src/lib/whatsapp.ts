import { brand } from '../config/brand'
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

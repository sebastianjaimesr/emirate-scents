/**
 * Pruebas de los mensajes y enlaces de WhatsApp.
 */
import { describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import { buildCartLines } from '../features/cart/cartItems'
import type { OrderConfirmation } from '../types/order'
import {
  buildCartInquiryMessage,
  buildOrderMessage,
  buildProductInquiryMessage,
  buildWhatsAppUrl,
  whatsappMessages,
} from './whatsapp'

/** Crea un producto de prueba; los campos no indicados toman valores por defecto. */
const product = (
  overrides: Partial<Product> & Pick<Product, 'id' | 'name' | 'price'>,
): Product => ({
  sku: overrides.id.toUpperCase(),
  slug: overrides.id,
  brand: { slug: 'casa-prueba', name: 'Casa Prueba' },
  categorySlug: 'perfumes-arabes',
  shortDescription: '',
  description: '',
  sizeMl: 100,
  images: [],
  stock: 5,
  publishedAt: '2026-01-01',
  isDemo: false,
  ...overrides,
})

const products = [
  product({ id: 'ar-0001', name: 'Oud Nocturno', price: 285000 }),
  product({ id: 'ar-0002', name: 'Ámbar del Desierto', price: 240000 }),
]

describe('buildWhatsAppUrl', () => {
  it('apunta al número oficial de Emirate Scents en formato internacional', () => {
    expect(buildWhatsAppUrl()).toBe('https://wa.me/573174096898')
  })

  it('no añade ?text= cuando el mensaje está vacío', () => {
    expect(buildWhatsAppUrl('   ')).toBe('https://wa.me/573174096898')
  })

  it('codifica tildes, saltos de línea y símbolos especiales', () => {
    const url = buildWhatsAppUrl('Hola, ¿tienen Oud & Rosa #1?\nGracias')
    expect(url).toBe(
      'https://wa.me/573174096898?text=Hola%2C%20%C2%BFtienen%20Oud%20%26%20Rosa%20%231%3F%0AGracias',
    )
    // Al decodificar debe recuperarse exactamente el texto original
    expect(decodeURIComponent(new URL(url).searchParams.get('text') ?? '')).toBe(
      'Hola, ¿tienen Oud & Rosa #1?\nGracias',
    )
  })

  it('rechaza números con símbolos o espacios', () => {
    expect(() => buildWhatsAppUrl('Hola', '+57 317 409 6898')).toThrow()
  })

  it('genera mensajes de categoría y búsqueda legibles', () => {
    expect(whatsappMessages.category('Perfumes árabes')).toContain('perfumes árabes')
    expect(whatsappMessages.search('oud')).toContain('"oud"')
  })
})

describe('buildProductInquiryMessage', () => {
  it('incluye producto, marca, tamaño, referencia, cantidad y precio en líneas separadas', () => {
    const product = products[0]
    const message = buildProductInquiryMessage(product, 2).replace(/\s/g, ' ')
    expect(message).toContain(`• Producto: ${product.name}`)
    expect(message).toContain(`• Marca: ${product.brand.name}`)
    expect(message).toContain(`• Tamaño: ${product.sizeMl} ml`)
    expect(message).toContain(`• Referencia: ${product.sku}`)
    expect(message).toContain('• Cantidad: 2')
    expect(message).toContain('• Precio unitario: $ 285.000')
  })

  it('omite el tamaño cuando no se conoce', () => {
    const product = { ...products[0], sizeMl: undefined }
    expect(buildProductInquiryMessage(product, 1)).not.toContain('Tamaño')
  })
})

describe('buildCartInquiryMessage', () => {
  it('lista cada producto con cantidad y precio, y el subtotal estimado', () => {
    const [a, b] = products as [Product, Product]
    const { lines, subtotal } = buildCartLines(
      [
        { productId: a.id, quantity: 2 },
        { productId: b.id, quantity: 1 },
      ],
      products,
    )
    const message = buildCartInquiryMessage(lines, subtotal).replace(/\s/g, ' ')
    expect(message).toContain(`• ${a.name} (${a.brand.name}, ${a.sizeMl} ml)`)
    expect(message).toContain('Cantidad: 2 · Precio unitario: $ 285.000')
    expect(message).toContain('Subtotal estimado: $ 810.000')
    expect(message).toContain('Envío: pendiente de cotización')
  })
})

describe('buildOrderMessage', () => {
  const order: OrderConfirmation = {
    orderNumber: 'ES-2026-000042',
    status: 'PENDIENTE_CONFIRMACION',
    createdAt: '2026-10-12T15:00:00.000Z',
    paymentMethod: 'CONTRA_ENTREGA',
    customer: { name: 'Ana Gómez', department: 'Antioquia', city: 'Medellín' },
    items: [
      {
        productId: 'ar-0001',
        name: 'Oud Nocturno',
        brandName: 'Casa Prueba',
        sku: 'AR-0001',
        sizeMl: 100,
        quantity: 2,
        unitPrice: 285000,
        lineTotal: 570000,
      },
    ],
    subtotal: 570000,
    shippingCost: null,
    total: 570000,
  }

  it('incluye número de pedido, productos, totales del servidor, pago y entrega', () => {
    const message = buildOrderMessage(order, {
      address: 'Calle 10 # 20-30',
      notes: 'Portería',
    }).replace(/\s/g, ' ')
    expect(message).toContain('pedido ES-2026-000042')
    expect(message).toContain('• Oud Nocturno (Casa Prueba, 100 ml)')
    expect(message).toContain('Ref. AR-0001 · Cantidad: 2 · $ 570.000')
    expect(message).toContain('Envío: pendiente de cotización')
    expect(message).toContain('Forma de pago: Pago contra entrega')
    expect(message).toContain('Entrega: Calle 10 # 20-30, Medellín (Antioquia)')
    expect(message).toContain('Observaciones: Portería')
  })

  it('se codifica bien en el enlace (el # de la dirección no corta el mensaje)', () => {
    const url = buildWhatsAppUrl(buildOrderMessage(order, { address: 'Calle 10 # 20-30' }))
    expect(new URL(url).searchParams.get('text')).toContain('Calle 10 # 20-30')
    expect(url).not.toContain('Observaciones')
  })
})

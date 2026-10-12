import { describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import { buildCartLines } from '../features/cart/cartItems'
import {
  buildCartInquiryMessage,
  buildProductInquiryMessage,
  buildWhatsAppUrl,
  whatsappMessages,
} from './whatsapp'

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

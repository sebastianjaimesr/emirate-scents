import { describe, expect, it } from 'vitest'
import { demoProducts } from '../data/demo/products.demo'
import { buildProductInquiryMessage, buildWhatsAppUrl, whatsappMessages } from './whatsapp'

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
    const product = demoProducts[0]
    const message = buildProductInquiryMessage(product, 2).replace(/\s/g, ' ')
    expect(message).toContain(`• Producto: ${product.name}`)
    expect(message).toContain(`• Marca: ${product.brand.name}`)
    expect(message).toContain(`• Tamaño: ${product.sizeMl} ml`)
    expect(message).toContain(`• Referencia: ${product.sku}`)
    expect(message).toContain('• Cantidad: 2')
    expect(message).toContain('• Precio unitario: $ 285.000')
  })

  it('omite el tamaño cuando no se conoce', () => {
    const product = { ...demoProducts[0], sizeMl: undefined }
    expect(buildProductInquiryMessage(product, 1)).not.toContain('Tamaño')
  })
})

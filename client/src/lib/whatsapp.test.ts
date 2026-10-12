import { describe, expect, it } from 'vitest'
import { buildWhatsAppUrl, whatsappMessages } from './whatsapp'

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

import { describe, expect, it } from 'vitest'
import { checkoutSchema, normalizeColombianMobile } from './checkoutSchema'

const valid = {
  name: 'Ana Gómez',
  phone: '317 409 6898',
  department: 'Antioquia',
  city: 'Medellín',
  address: 'Calle 10 # 20-30',
  notes: '',
  paymentMethod: 'CONTRA_ENTREGA',
  dataConsent: true,
  website: '',
}

describe('normalizeColombianMobile', () => {
  it('acepta espacios, guiones y el prefijo +57', () => {
    expect(normalizeColombianMobile('+57 317-409 6898')).toBe('3174096898')
    expect(normalizeColombianMobile('(317) 409 6898')).toBe('3174096898')
    expect(normalizeColombianMobile('573174096898')).toBe('3174096898')
  })
})

describe('checkoutSchema', () => {
  it('acepta un pedido completo', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('explica cada campo inválido en español', () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      name: 'A',
      phone: '601 234 5678',
      department: 'Texas',
      dataConsent: false,
    })
    expect(result.success).toBe(false)
    const messages = Object.fromEntries(
      result.error!.issues.map((issue) => [issue.path.join('.'), issue.message]),
    )
    expect(messages).toEqual({
      name: 'Escribe tu nombre completo',
      phone: 'Escribe un celular colombiano de 10 dígitos (empieza por 3)',
      department: 'Elige tu departamento',
      dataConsent: 'Necesitamos tu autorización para gestionar el pedido',
    })
  })
})

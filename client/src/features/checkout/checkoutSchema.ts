import { z } from 'zod'
import { colombianDepartments } from '../../data/colombia'

/*
  Reglas del formulario de pedido. Son las mismas que aplica la API
  (server/src/validators/order.ts): aquí sirven para avisar al cliente al instante,
  allí para que nadie pueda saltárselas.
*/

/** "+57 317-409 6898" → "3174096898". */
export function normalizeColombianMobile(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
}

const requiredText = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Máximo ${max} caracteres`)

export const checkoutSchema = z.object({
  name: requiredText(3, 80, 'Escribe tu nombre completo'),
  phone: z
    .string()
    .max(30)
    .refine(
      (value) => /^3\d{9}$/.test(normalizeColombianMobile(value)),
      'Escribe un celular colombiano de 10 dígitos (empieza por 3)',
    ),
  department: z.enum(colombianDepartments, 'Elige tu departamento'),
  city: requiredText(2, 60, 'Escribe tu ciudad o municipio'),
  address: requiredText(5, 160, 'Escribe la dirección de entrega'),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
  paymentMethod: z.enum(['CONTRA_ENTREGA', 'ACORDAR_POR_WHATSAPP'], 'Elige una forma de pago'),
  dataConsent: z.literal(true, 'Necesitamos tu autorización para gestionar el pedido'),
  website: z.string().max(0),
})

export type CheckoutValues = z.input<typeof checkoutSchema>
export type CheckoutData = z.output<typeof checkoutSchema>

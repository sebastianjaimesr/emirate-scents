import { z } from 'zod'
import { colombianDepartments } from '../data/colombia.js'

export const MAX_ORDER_LINES = 20
export const MAX_QUANTITY_PER_ITEM = 10

/** Texto de una línea: sin espacios de sobra ni caracteres de control. */
const text = (min: number, max: number) =>
  z
    .string()
    .transform((value) =>
      value
        .replace(/\p{Cc}/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .pipe(z.string().min(min).max(max))

/**
 * Celular colombiano: acepta "317 409 6898", "+57 317-409-6898" o "573174096898"
 * y lo guarda como 10 dígitos que empiezan por 3.
 */
export const colombianMobile = z
  .string()
  .max(30)
  .transform((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
  })
  .pipe(z.string().regex(/^3\d{9}$/, 'Escribe un celular colombiano de 10 dígitos (empieza por 3)'))

export const createOrderSchema = z.object({
  customer: z.object({
    name: text(3, 80),
    phone: colombianMobile,
    department: z.enum(colombianDepartments),
    city: text(2, 60),
    address: text(5, 160),
    notes: z
      .string()
      .max(500)
      .transform((value) => value.trim())
      .optional()
      .transform((value) => value || undefined),
  }),
  paymentMethod: z.enum(['CONTRA_ENTREGA', 'ACORDAR_POR_WHATSAPP']),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
      }),
    )
    .min(1, 'El pedido está vacío')
    .max(MAX_ORDER_LINES)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      'Hay productos repetidos',
    ),
  /** Autorización de tratamiento de datos (Ley 1581 de 2012): obligatoria. */
  dataConsent: z.literal(true, 'Debes autorizar el tratamiento de tus datos'),
  /** Campo trampa invisible para personas: si un robot lo llena, el pedido se rechaza. */
  website: z.string().max(0).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

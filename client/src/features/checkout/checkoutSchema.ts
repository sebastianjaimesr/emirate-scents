import * as z from 'zod/mini'
import { colombianDepartments } from '../../data/colombia'

/*
  Reglas del formulario de pedido. Son las mismas que aplica la API
  (server/src/validators/order.ts): aquí sirven para avisar al cliente al instante,
  allí para que nadie pueda saltárselas.
  Usa "zod/mini", la versión compacta de Zod: mismas reglas, mucho menos
  JavaScript para descargar en la página del pedido.
*/

/** "+57 317-409 6898" → "3174096898". */
export function normalizeColombianMobile(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
}

/** Regla de texto obligatorio: quita espacios y valida largo mínimo y máximo. */
const requiredText = (min: number, max: number, message: string) =>
  z
    .string()
    .check(z.trim(), z.minLength(min, message), z.maxLength(max, `Máximo ${max} caracteres`))

/**
 * Validaciones del formulario de compra con Zod: nombre, celular colombiano, ubicación, dirección,
 * método de pago, autorización de datos y un campo trampa (website) contra bots.
 */
export const checkoutSchema = z.object({
  name: requiredText(3, 80, 'Escribe tu nombre completo'),
  phone: z.string().check(
    z.maxLength(30, 'Máximo 30 caracteres'),
    z.refine(
      (value) => /^3\d{9}$/.test(normalizeColombianMobile(value)),
      'Escribe un celular colombiano de 10 dígitos (empieza por 3)',
    ),
  ),
  department: z.enum(colombianDepartments, 'Elige tu departamento'),
  city: requiredText(2, 60, 'Escribe tu ciudad o municipio'),
  address: requiredText(5, 160, 'Escribe la dirección de entrega'),
  notes: z.string().check(z.trim(), z.maxLength(500, 'Máximo 500 caracteres')),
  paymentMethod: z.enum(['CONTRA_ENTREGA', 'ACORDAR_POR_WHATSAPP'], 'Elige una forma de pago'),
  dataConsent: z.literal(true, 'Necesitamos tu autorización para gestionar el pedido'),
  website: z.string().check(z.maxLength(0)),
})

/** Valores tal como los escribe el usuario (antes de validar). */
export type CheckoutValues = z.input<typeof checkoutSchema>
/** Datos ya validados y limpios (después de validar). */
export type CheckoutData = z.output<typeof checkoutSchema>

import { z } from 'zod'

/*
  Validación de todo lo que llega al panel. Ningún dato se guarda sin pasar por aquí.
  Los mensajes están pensados para mostrarse tal cual en el formulario del panel.
*/

const singleLine = (min: number, max: number) =>
  z
    .string()
    .transform((value) =>
      value
        .replace(/\p{Cc}/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .pipe(
      z
        .string()
        .min(min, min === 1 ? 'Campo obligatorio' : `Mínimo ${min} caracteres`)
        .max(max, `Máximo ${max} caracteres`),
    )

/** Texto de varias líneas: conserva los saltos de línea, quita el resto de caracteres de control. */
const multiLine = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/[^\P{Cc}\n]/gu, '').trim())
    .pipe(z.string().max(max, `Máximo ${max} caracteres`))

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (ejemplo: oud-rosa)')

export const idParam = z.object({ id: z.string().min(1).max(64) })

// ── Acceso ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Correo inválido')),
  password: z.string().min(1, 'Escribe la contraseña').max(256),
})

// ── Productos ──────────────────────────────────────────────────────────────────────────

const pesos = z
  .number('Escribe el precio en pesos')
  .int('Sin decimales')
  .min(0, 'No puede ser negativo')
  .max(100_000_000, 'Precio demasiado alto')

const notes = z.array(singleLine(1, 60)).max(12, 'Máximo 12 notas')

/** Campos de un producto, sin valores por defecto (al editar, un campo ausente no se toca). */
const productFields = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(AR|DS|NI|EQ)-\d{4}$/, 'Usa el formato AR-0001, DS-0001, NI-0001 o EQ-0001'),
  slug: slugSchema,
  name: singleLine(2, 80),
  brandId: z.string().min(1, 'Elige una marca').max(64),
  categoryId: z.string().min(1, 'Elige una categoría').max(64),
  shortDescription: singleLine(0, 160),
  description: multiLine(2000),
  price: pesos,
  compareAtPrice: pesos.nullable(),
  sizeMl: z.number().int().min(1).max(1000).nullable(),
  concentration: z.enum(['EXTRAIT', 'PARFUM', 'EDP', 'EDT', 'EDC', 'ACEITE', 'OTRA']).nullable(),
  olfactoryFamily: singleLine(1, 40).nullable(),
  notesTop: notes,
  notesHeart: notes,
  notesBase: notes,
  audience: z.enum(['FEMENINO', 'MASCULINO', 'UNISEX']).nullable(),
  inspirationReference: singleLine(1, 120).nullable(),
  lowStockThreshold: z.number().int().min(0).max(1000),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  isDemo: z.boolean(),
})

function checkCompareAtPrice(
  product: { price?: number; compareAtPrice?: number | null },
  ctx: z.RefinementCtx,
) {
  if (
    product.compareAtPrice != null &&
    product.price !== undefined &&
    product.compareAtPrice <= product.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['compareAtPrice'],
      message:
        'El precio anterior debe ser mayor que el precio actual (solo si el descuento es real)',
    })
  }
}

/** Crear: el producto nace como borrador. Las existencias iniciales generan una ENTRADA. */
export const createProductSchema = productFields
  .extend({
    shortDescription: productFields.shape.shortDescription.default(''),
    description: productFields.shape.description.default(''),
    compareAtPrice: productFields.shape.compareAtPrice.default(null),
    sizeMl: productFields.shape.sizeMl.default(null),
    concentration: productFields.shape.concentration.default(null),
    olfactoryFamily: productFields.shape.olfactoryFamily.default(null),
    notesTop: notes.default([]),
    notesHeart: notes.default([]),
    notesBase: notes.default([]),
    audience: productFields.shape.audience.default(null),
    inspirationReference: productFields.shape.inspirationReference.default(null),
    lowStockThreshold: productFields.shape.lowStockThreshold.default(2),
    isNew: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isDemo: z.boolean().default(false),
    initialStock: z.number().int().min(0).max(10_000).default(0),
  })
  .strict()
  .superRefine(checkCompareAtPrice)

/**
 * Editar: solo los campos enviados. Las existencias NO se editan aquí (solo con movimientos
 * de inventario) y el estado tiene su propio endpoint.
 */
export const updateProductSchema = productFields
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios')

export const productStatusSchema = z.object({
  status: z.enum(['BORRADOR', 'PUBLICADO', 'ARCHIVADO']),
})

export const adminProductsQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
  estado: z.enum(['BORRADOR', 'PUBLICADO', 'ARCHIVADO']).optional(),
  categoria: z.string().max(64).optional(),
  marca: z.string().max(64).optional(),
  stock: z.enum(['bajo', 'agotado']).optional(),
  orden: z.enum(['recientes', 'nombre', 'stock-asc', 'precio-desc']).default('recientes'),
  pagina: z.coerce.number().int().min(1).max(10_000).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(25),
})

// ── Imágenes ───────────────────────────────────────────────────────────────────────────

export const imageParams = z.object({
  id: z.string().min(1).max(64),
  imageId: z.string().min(1).max(64),
})

export const imageAltSchema = z.object({ alt: singleLine(3, 200) }).strict()

export const imageOrderSchema = z
  .object({ imageIds: z.array(z.string().min(1).max(64)).min(1).max(30) })
  .strict()
  .refine((value) => new Set(value.imageIds).size === value.imageIds.length, 'Hay fotos repetidas')

// ── Inventario ─────────────────────────────────────────────────────────────────────────

export const inventoryMovementSchema = z
  .object({
    productId: z.string().min(1).max(64),
    type: z.enum(['ENTRADA', 'AJUSTE'], 'Desde el panel solo se registran entradas y ajustes'),
    quantity: z
      .number('Escribe las unidades')
      .int('Escribe un número entero')
      .min(-10_000)
      .max(10_000)
      .refine((value) => value !== 0, 'La cantidad no puede ser 0'),
    reason: singleLine(3, 200),
  })
  .strict()
  .refine((value) => value.type !== 'ENTRADA' || value.quantity > 0, {
    path: ['quantity'],
    message: 'Una entrada suma unidades: la cantidad debe ser positiva',
  })

export const movementsQuerySchema = z.object({
  producto: z.string().max(64).optional(),
  tipo: z.enum(['ENTRADA', 'AJUSTE', 'VENTA', 'DEVOLUCION']).optional(),
  pagina: z.coerce.number().int().min(1).max(10_000).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(50),
})

// ── Categorías y marcas ────────────────────────────────────────────────────────────────

export const categorySchema = z
  .object({
    name: singleLine(2, 60),
    slug: slugSchema,
    position: z.number().int().min(0).max(1000).default(0),
  })
  .strict()
export const updateCategorySchema = categorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios')

export const brandSchema = z.object({ name: singleLine(2, 60), slug: slugSchema }).strict()
export const updateBrandSchema = brandSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios')

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>
export type MovementsQuery = z.infer<typeof movementsQuerySchema>
export type OrdersQuery = z.infer<typeof ordersQuerySchema>

// ── Pedidos ────────────────────────────────────────────────────────────────────────────

const orderStatuses = [
  'PENDIENTE_CONFIRMACION',
  'CONFIRMADO',
  'EN_PREPARACION',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
] as const

export const ordersQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
  estado: z.enum(orderStatuses).optional(),
  pagina: z.coerce.number().int().min(1).max(10_000).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(25),
})

export const orderStatusChangeSchema = z
  .object({
    status: z.enum(orderStatuses, 'Elige un estado'),
    note: singleLine(0, 300).default(''),
  })
  .strict()
  .refine((value) => value.status !== 'CANCELADO' || value.note.length >= 3, {
    path: ['note'],
    message: 'Escribe el motivo de la cancelación',
  })

export const orderShippingSchema = z
  .object({ shippingCost: pesos.max(5_000_000, 'Costo de envío demasiado alto').nullable() })
  .strict()

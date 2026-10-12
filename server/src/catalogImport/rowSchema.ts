import { z } from 'zod'

/*
  Reglas de cada fila de docs/plantilla-catalogo.csv (explicadas en docs/catalogo-real.md).
  Una celda vacía significa "no lo sé": el campo queda vacío en la tienda, nunca inventado.
*/

export const catalogColumns = [
  'sku',
  'nombre',
  'marca',
  'categoria',
  'descripcion_corta',
  'descripcion',
  'precio_cop',
  'precio_anterior_cop',
  'tamano_ml',
  'concentracion',
  'familia_olfativa',
  'notas_salida',
  'notas_corazon',
  'notas_fondo',
  'publico',
  'referencia_equivalencia',
  'inventario',
  'nuevo',
  'recomendado',
  'fotos',
] as const

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)
const optionalText = (max: number) => z.preprocess(emptyToUndefined, text(max).optional())

/** "285.000", "$ 285000" o "285000" → 285000 (pesos enteros). */
const pesos = z.preprocess(
  (value) => (typeof value === 'string' ? value.replace(/[$\s.]/g, '') : value),
  z
    .string()
    .regex(/^\d+$/, 'Escribe solo números, sin decimales (ejemplo: 285000)')
    .transform(Number)
    .pipe(z.number().int().min(1000, 'El precio parece demasiado bajo').max(100_000_000)),
)

const list = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value
          .split(';')
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z.array(text(60)).max(12, 'Máximo 12 elementos'),
)

const yesNo = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z
    .enum(['', 'si', 'sí', 'no'], 'Escribe "si" o deja la celda vacía')
    .transform((value) => value === 'si' || value === 'sí'),
)

const upper = (value: unknown) =>
  typeof value === 'string' ? emptyToUndefined(value.trim().toUpperCase()) : value

export const catalogRowSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^(AR|DS|NI|EQ)-\d{4}$/, 'Usa el formato AR-0001, DS-0001, NI-0001 o EQ-0001'),
    nombre: text(80).min(2, 'Falta el nombre'),
    marca: text(60).min(2, 'Falta la marca'),
    categoria: z.enum(
      ['perfumes-arabes', 'disenador', 'nicho', 'equivalencias'],
      'Usa perfumes-arabes, disenador, nicho o equivalencias',
    ),
    descripcion_corta: text(160).min(1, 'Falta la descripción corta'),
    descripcion: text(2000).min(1, 'Falta la descripción'),
    precio_cop: pesos,
    precio_anterior_cop: z.preprocess(emptyToUndefined, pesos.optional()),
    tamano_ml: z.preprocess(
      emptyToUndefined,
      z.coerce.number('Escribe solo el número de mililitros').int().min(1).max(1000).optional(),
    ),
    concentracion: z.preprocess(
      upper,
      z
        .enum(
          ['EXTRAIT', 'PARFUM', 'EDP', 'EDT', 'EDC', 'ACEITE', 'OTRA'],
          'Concentración no válida',
        )
        .optional(),
    ),
    familia_olfativa: optionalText(40),
    notas_salida: list,
    notas_corazon: list,
    notas_fondo: list,
    publico: z.preprocess(
      upper,
      z.enum(['FEMENINO', 'MASCULINO', 'UNISEX'], 'Usa FEMENINO, MASCULINO o UNISEX').optional(),
    ),
    referencia_equivalencia: optionalText(120),
    inventario: z.coerce
      .number('Escribe las unidades disponibles')
      .int('Escribe un número entero')
      .min(0)
      .max(10_000),
    nuevo: yesNo,
    recomendado: yesNo,
    fotos: list,
  })
  .superRefine((row, ctx) => {
    if (row.precio_anterior_cop !== undefined && row.precio_anterior_cop <= row.precio_cop) {
      ctx.addIssue({
        code: 'custom',
        path: ['precio_anterior_cop'],
        message: 'El precio anterior debe ser mayor que el actual (solo si el descuento es real)',
      })
    }
    if (row.referencia_equivalencia && row.categoria !== 'equivalencias') {
      ctx.addIssue({
        code: 'custom',
        path: ['referencia_equivalencia'],
        message: 'Solo los productos de la categoría equivalencias llevan referencia',
      })
    }
    if (!row.sku.startsWith(skuPrefix[row.categoria])) {
      ctx.addIssue({
        code: 'custom',
        path: ['sku'],
        message: `En la categoría ${row.categoria} el código empieza por ${skuPrefix[row.categoria]}`,
      })
    }
  })

const skuPrefix = {
  'perfumes-arabes': 'AR-',
  disenador: 'DS-',
  nicho: 'NI-',
  equivalencias: 'EQ-',
} as const

export type CatalogRow = z.output<typeof catalogRowSchema>

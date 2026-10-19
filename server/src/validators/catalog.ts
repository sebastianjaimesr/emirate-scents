import { z } from 'zod'

/*
  Validación de lo que llega en la URL. Los nombres de los parámetros son los mismos
  que usa la tienda (?marca=a,b&orden=precio-asc...), así que un enlace del catálogo
  se traduce directamente a una petición a la API.
*/

export const sortValues = [
  'destacados',
  'novedades',
  'precio-asc',
  'precio-desc',
  'nombre',
] as const
/** Valores posibles de orden del catálogo. */
export type SortOption = (typeof sortValues)[number]

export const MAX_PAGE_SIZE = 48
export const DEFAULT_PAGE_SIZE = 12

/** Validación de un slug en la URL. */
const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Formato de identificador inválido')

/** "a,b,c" → ["a", "b", "c"], sin vacíos ni repetidos. */
const csvList = <T extends z.ZodType>(item: T, max = 20) =>
  z.preprocess(
    (value) =>
      typeof value === 'string'
        ? [
            ...new Set(
              value
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean),
            ),
          ]
        : (value ?? []),
    z.array(item).max(max, `Máximo ${max} valores`),
  )

/** Número entero entre 0 y mil millones (para precios). */
const wholeNumber = z.coerce.number().int().min(0).max(1_000_000_000)

/** Validación de los filtros del catálogo que llegan en la URL (?q=, ?marca=, ?tamano=...). */
export const catalogQuerySchema = z
  .object({
    q: z.string().trim().max(100).default(''),
    categoria: slug.optional(),
    marca: csvList(slug),
    tamano: csvList(z.coerce.number().int().positive().max(10_000)),
    familia: csvList(z.string().max(60)),
    precioMin: wholeNumber.optional(),
    precioMax: wholeNumber.optional(),
    orden: z.enum(sortValues).default('destacados'),
    pagina: z.coerce.number().int().min(1).max(10_000).default(1),
    porPagina: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine(
    (query) =>
      query.precioMin === undefined ||
      query.precioMax === undefined ||
      query.precioMin <= query.precioMax,
    { message: 'precioMin no puede ser mayor que precioMax', path: ['precioMin'] },
  )

/** Filtros del catálogo ya validados. */
export type CatalogQuery = z.infer<typeof catalogQuerySchema>

/** Validación de los parámetros de los filtros disponibles. */
export const facetsQuerySchema = z.object({ categoria: slug.optional() })

/** Validación del parámetro :slug. */
export const slugParamsSchema = z.object({ slug })

export const highlightKinds = ['recomendados', 'novedades', 'mas-vendidos'] as const
/** Tipos de productos destacados. */
export type HighlightKind = (typeof highlightKinds)[number]

/** Validación del tipo de destacados. */
export const highlightParamsSchema = z.object({ kind: z.enum(highlightKinds) })

/** Validación de ?limite= (entre 1 y 12, por defecto 4). */
export const limitQuerySchema = z.object({
  limite: z.coerce.number().int().min(1).max(12).default(4),
})

export const MAX_LOOKUP_IDS = 50

/** Validación de ?ids= para buscar productos del carrito. */
export const lookupQuerySchema = z.object({
  ids: csvList(z.string().min(1).max(64), MAX_LOOKUP_IDS),
})

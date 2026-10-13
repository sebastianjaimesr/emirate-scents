import type { AdminProduct, Audience, Concentration } from './types'

/*
  Valores del formulario de producto. Los campos se guardan como texto mientras se escriben
  y se convierten a números o listas solo al enviar (toPayload). La validación definitiva
  la hace el servidor; aquí solo se evita enviar algo obviamente vacío.
*/
export interface ProductFormValues {
  name: string
  sku: string
  slug: string
  brandId: string
  categoryId: string
  price: string
  compareAtPrice: string
  sizeMl: string
  concentration: Concentration | ''
  olfactoryFamily: string
  audience: Audience | ''
  notesTop: string
  notesHeart: string
  notesBase: string
  inspirationReference: string
  shortDescription: string
  description: string
  isNew: boolean
  isFeatured: boolean
  isDemo: boolean
  lowStockThreshold: string
  initialStock: string
}

export const emptyProduct: ProductFormValues = {
  name: '',
  sku: '',
  slug: '',
  brandId: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  sizeMl: '',
  concentration: '',
  olfactoryFamily: '',
  audience: '',
  notesTop: '',
  notesHeart: '',
  notesBase: '',
  inspirationReference: '',
  shortDescription: '',
  description: '',
  isNew: false,
  isFeatured: false,
  isDemo: false,
  lowStockThreshold: '2',
  initialStock: '0',
}

export function toFormValues(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    brandId: product.brand.id,
    categoryId: product.category.id,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice === null ? '' : String(product.compareAtPrice),
    sizeMl: product.sizeMl === null ? '' : String(product.sizeMl),
    concentration: product.concentration ?? '',
    olfactoryFamily: product.olfactoryFamily ?? '',
    audience: product.audience ?? '',
    notesTop: product.notesTop.join(', '),
    notesHeart: product.notesHeart.join(', '),
    notesBase: product.notesBase.join(', '),
    inspirationReference: product.inspirationReference ?? '',
    shortDescription: product.shortDescription,
    description: product.description,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isDemo: product.isDemo,
    lowStockThreshold: String(product.lowStockThreshold),
    initialStock: '0',
  }
}

/** "285.000" o "$ 285000" → 285000. Vacío → null. Texto no numérico → NaN (el servidor lo rechaza). */
export function parsePesos(value: string) {
  const digits = value.replace(/[$\s.]/g, '')
  return digits === '' ? null : Number(digits)
}

const parseInteger = (value: string) => (value.trim() === '' ? null : Number(value))
const list = (value: string) =>
  value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
const orNull = (value: string) => value.trim() || null

export function toPayload(values: ProductFormValues, isNew: boolean) {
  return {
    name: values.name,
    sku: values.sku,
    slug: values.slug,
    brandId: values.brandId,
    categoryId: values.categoryId,
    price: parsePesos(values.price),
    compareAtPrice: parsePesos(values.compareAtPrice),
    sizeMl: parseInteger(values.sizeMl),
    concentration: values.concentration || null,
    olfactoryFamily: orNull(values.olfactoryFamily),
    audience: values.audience || null,
    notesTop: list(values.notesTop),
    notesHeart: list(values.notesHeart),
    notesBase: list(values.notesBase),
    inspirationReference: orNull(values.inspirationReference),
    shortDescription: values.shortDescription,
    description: values.description,
    isNew: values.isNew,
    isFeatured: values.isFeatured,
    isDemo: values.isDemo,
    lowStockThreshold: parseInteger(values.lowStockThreshold) ?? 2,
    ...(isNew && { initialStock: parseInteger(values.initialStock) ?? 0 }),
  }
}

/** Dirección del producto a partir del nombre: "Oud Rosa 100 ml" → "oud-rosa-100-ml". */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

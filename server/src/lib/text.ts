/**
 * Quita tildes, mayúsculas y signos para que "ambar" encuentre "Ámbar".
 * Solo deja letras a-z, números y espacios: así un "%" o un "_" escritos en el buscador
 * no pueden actuar como comodines en la consulta a la base de datos.
 */
export function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Palabras de búsqueda normalizadas: "Oud  ROSA" → ["oud", "rosa"]. */
export function searchWords(search: string) {
  const normalized = normalizeText(search)
  return normalized ? normalized.split(' ') : []
}

interface SearchableProduct {
  name: string
  brandName: string
  olfactoryFamily?: string | null
  notesTop?: string[]
  notesHeart?: string[]
  notesBase?: string[]
}

/** Texto que se guarda en Product.searchText: nombre, marca, familia y notas. */
export function buildSearchText(product: SearchableProduct) {
  return normalizeText(
    [
      product.name,
      product.brandName,
      product.olfactoryFamily ?? '',
      ...(product.notesTop ?? []),
      ...(product.notesHeart ?? []),
      ...(product.notesBase ?? []),
    ].join(' '),
  )
}

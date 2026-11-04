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

/**
 * Puntaje de relevancia de un producto para una búsqueda (orden "Relevancia").
 * Pesa más que la búsqueda coincida con el NOMBRE (exacto > empieza igual > lo contiene)
 * que con la marca; las notas y la familia solo sirven para encontrar, no para ordenar.
 * Lo usan la API y la vista previa de GitHub Pages, así ordenan igual.
 */
export function relevanceScore(product: { name: string; brandName: string }, words: string[]) {
  if (words.length === 0) return 0
  const name = normalizeText(product.name)
  const brand = normalizeText(product.brandName)
  const phrase = words.join(' ')
  const nameWords = name.split(' ')
  let score = 0
  if (name === phrase) score += 100
  else if (name.startsWith(phrase)) score += 60
  else if (name.includes(phrase)) score += 40
  for (const word of words) {
    if (nameWords.includes(word)) score += 10
    else if (name.includes(word)) score += 5
    if (brand.includes(word)) score += 3
  }
  return score
}

/**
 * Números de página a mostrar: siempre la primera, la última y las vecinas de la actual.
 * Ejemplo con 10 páginas en la 5: [1, '…', 4, 5, 6, '…', 10]
 */
export function getPageItems(page: number, totalPages: number): Array<number | '…'> {
  const pages = new Set(
    [1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages),
  )
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((number, index) =>
    index > 0 && number - sorted[index - 1] > 1 ? ['…' as const, number] : [number],
  )
}

/**
 * Lector de CSV sin dependencias. Acepta lo que exportan Excel y Google Sheets:
 * separador "," o ";" (Excel en español usa ";"), celdas entre comillas con saltos
 * de línea o comillas dobles dentro, y la marca BOM del inicio del archivo.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, '')
  const firstLine = source.slice(0, source.search(/\r?\n|$/))
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
    } else if (char === '"' && cell === '') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  // Las filas totalmente vacías (por ejemplo, al final del archivo) no cuentan
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''))
}

import { DISPLAY_FONT } from '../scenes/displayFont'

/**
 * Divide un nombre largo en dos líneas, cortando en el espacio más cercano a la mitad.
 * "Equivalencia Floral Dulce" → ["Equivalencia", "Floral Dulce"].
 */
export function splitName(name: string, maxChars = 14): string[] {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (clean.length <= maxChars || !clean.includes(' ')) return [clean]
  const middle = clean.length / 2
  let best = -1
  for (let index = clean.indexOf(' '); index !== -1; index = clean.indexOf(' ', index + 1)) {
    if (best === -1 || Math.abs(index - middle) < Math.abs(best - middle)) best = index
  }
  return [clean.slice(0, best), clean.slice(best + 1)]
}

/**
 * Elige `count` puntos dentro de las letras a partir del canal alfa de una imagen de
 * `width` × `height`. Devuelve [x0, y0, x1, y1...] centrados en 0: x va de -0.5 a 0.5 y y
 * conserva la proporción de la imagen (hacia arriba es positivo).
 * Si hay menos píxeles de letra que puntos, varios puntos comparten píxel con un leve desvío.
 */
export function pickPoints(
  alpha: (index: number) => number,
  width: number,
  height: number,
  count: number,
  random: () => number = Math.random,
): Float32Array {
  const inside: number[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha(y * width + x) > 128) inside.push(x, y)
    }
  }
  const points = new Float32Array(count * 2)
  const total = inside.length / 2
  for (let i = 0; i < count; i++) {
    if (total === 0) {
      // Sin letras (nombre vacío): los puntos quedan en una franja horizontal
      points[i * 2] = random() - 0.5
      points[i * 2 + 1] = (random() - 0.5) * 0.05
      continue
    }
    const pick = Math.floor(random() * total)
    const px = inside[pick * 2] + random()
    const py = inside[pick * 2 + 1] + random()
    points[i * 2] = px / width - 0.5
    points[i * 2 + 1] = (height / 2 - py) / width
  }
  return points
}

/**
 * Dibuja el nombre en un lienzo invisible y devuelve `count` puntos dentro de sus letras.
 * `maxChars`: a partir de cuántas letras el nombre se parte en dos líneas (en celulares se
 * parte antes, para que las letras salgan más grandes).
 */
export function sampleNamePoints(name: string, count: number, maxChars = 14): Float32Array {
  const lines = splitName(name, maxChars)
  const width = 640
  const lineHeight = 150
  const height = lineHeight * lines.length + 40
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return pickPoints(() => 0, 1, 1, count)

  // Tamaño de letra que hace caber la línea más larga en el 92 % del ancho
  let size = 140
  context.font = `500 ${size}px ${DISPLAY_FONT}`
  const widest = Math.max(...lines.map((line) => context.measureText(line).width))
  size = Math.min(size, Math.floor((size * width * 0.92) / Math.max(widest, 1)))
  context.font = `500 ${size}px ${DISPLAY_FONT}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#fff'
  lines.forEach((line, index) => {
    const y = height / 2 + (index - (lines.length - 1) / 2) * lineHeight * (size / 140)
    context.fillText(line, width / 2, y)
  })

  const { data } = context.getImageData(0, 0, width, height)
  return pickPoints((index) => data[index * 4 + 3], width, height, count)
}

import { CanvasTexture, SRGBColorSpace } from 'three'
import { DISPLAY_FONT } from '../scenes/displayFont'

export interface PlaqueText {
  brand: string
  name: string
  details: string
  isDemo: boolean
}

const SANS = '"Manrope Variable", "Segoe UI", system-ui, sans-serif'

/** Escribe `text` con espacio extra entre letras (el lienzo no siempre lo permite por CSS). */
function spacedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  const chars = [...text]
  const total =
    chars.reduce((sum, char) => sum + context.measureText(char).width, 0) +
    spacing * (chars.length - 1)
  let cursor = x - total / 2
  for (const char of chars) {
    context.fillText(char, cursor + context.measureText(char).width / 2, y)
    cursor += context.measureText(char).width + spacing
  }
}

/**
 * Placa grabada para un perfume sin foto: piedra oscura con filo dorado, la casa, el nombre
 * y los detalles. Los productos de demostración llevan la etiqueta DEMO en rojo, igual que
 * en el resto de la tienda. No dibuja ningún frasco: solo texto.
 */
export function createPlaqueTexture({ brand, name, details, isDemo }: PlaqueText) {
  const width = 1024
  const height = 640
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!

  const stone = context.createLinearGradient(0, 0, 0, height)
  stone.addColorStop(0, '#221c16')
  stone.addColorStop(1, '#120f0c')
  context.fillStyle = stone
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(201, 165, 78, 0.85)'
  context.lineWidth = 3
  context.strokeRect(28, 28, width - 56, height - 56)
  context.strokeStyle = 'rgba(201, 165, 78, 0.35)'
  context.lineWidth = 1.5
  context.strokeRect(44, 44, width - 88, height - 88)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  let top = isDemo ? 200 : 170

  if (isDemo) {
    context.fillStyle = '#8c1c2b'
    context.fillRect(width / 2 - 70, 90, 140, 46)
    context.fillStyle = '#f7f1e6'
    context.font = `700 24px ${SANS}`
    spacedText(context, 'DEMO', width / 2, 114, 5)
  }

  context.fillStyle = '#c9a54e'
  context.font = `600 28px ${SANS}`
  spacedText(context, brand.toUpperCase(), width / 2, top, 7)

  // El nombre ocupa como mucho el 84 % del ancho
  let size = 112
  context.font = `500 ${size}px ${DISPLAY_FONT}`
  size = Math.min(
    size,
    Math.floor((size * width * 0.84) / Math.max(context.measureText(name).width, 1)),
  )
  context.font = `500 ${size}px ${DISPLAY_FONT}`
  context.fillStyle = '#f7f1e6'
  top += 60 + size * 0.55
  context.fillText(name, width / 2, top)

  if (details) {
    context.fillStyle = '#b8b0a2'
    context.font = `400 30px ${SANS}`
    context.fillText(details, width / 2, top + size * 0.55 + 50)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

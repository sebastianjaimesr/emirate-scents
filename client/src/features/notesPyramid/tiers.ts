import type { OlfactoryNotes } from '../../types/product'

export type TierKey = keyof OlfactoryNotes

/** Los tres pisos de la pirámide, de arriba abajo. */
export const tiers: { key: TierKey; label: string; hint: string; color: string }[] = [
  { key: 'top', label: 'Salida', hint: 'Los primeros minutos', color: '#f0dc8c' },
  { key: 'heart', label: 'Corazón', hint: 'Las primeras horas', color: '#e3a8a0' },
  { key: 'base', label: 'Fondo', hint: 'Lo que permanece', color: '#c07f42' },
]

/**
 * Dónde va cada nota en su piso: repartidas en círculo, con el mismo espacio entre ellas.
 * Cada piso empieza en un ángulo distinto para que las notas no queden alineadas en vertical.
 * Devuelve el ángulo en radianes.
 */
export function noteAngles(count: number, tierIndex: number): number[] {
  const start = tierIndex * 0.7
  return Array.from({ length: count }, (_, index) => start + (index / count) * Math.PI * 2)
}

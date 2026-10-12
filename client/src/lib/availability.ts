export type AvailabilityStatus = 'available' | 'low' | 'sold-out'

/** Umbral a partir del cual se muestra "Últimas unidades". */
export const LOW_STOCK_THRESHOLD = 3

/** Disponibilidad a partir del inventario real (nunca se afirma sin stock). */
export function getAvailability(stock: number): { status: AvailabilityStatus; label: string } {
  if (stock <= 0) return { status: 'sold-out', label: 'Agotado' }
  if (stock <= LOW_STOCK_THRESHOLD) return { status: 'low', label: 'Últimas unidades' }
  return { status: 'available', label: 'Disponible' }
}

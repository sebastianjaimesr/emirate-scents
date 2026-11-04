/**
 * Formato de precios en pesos colombianos.
 */
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/** Formatea un precio en pesos colombianos: 285000 → "$ 285.000" */
export function formatCOP(amount: number) {
  return copFormatter.format(amount)
}

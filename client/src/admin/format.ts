/**
 * Formatos de fecha y dinero para el panel de administración (zona horaria de Colombia).
 */
const dateTime = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
})

/** Fecha y hora de Colombia: "13 oct 2026, 9:41 a. m." */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

/** "+6" / "−3": cantidad de un movimiento de inventario. */
export const formatQuantity = (quantity: number) =>
  quantity > 0 ? `+${quantity}` : `−${Math.abs(quantity)}`

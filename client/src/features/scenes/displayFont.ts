/** Fuente de los títulos de la marca, la misma que usa el CSS (--font-display). */
export const DISPLAY_FONT = '"Cormorant Garamond", "Times New Roman", serif'

/**
 * Espera a que la fuente de títulos esté descargada antes de dibujar texto en un lienzo:
 * si no, el navegador usaría una fuente de reserva y las letras saldrían distintas.
 */
export async function loadDisplayFont(weight = 500) {
  try {
    await document.fonts.load(`${weight} 64px "Cormorant Garamond"`)
  } catch {
    // Sin la fuente se dibuja con la de reserva: se ve distinto, pero funciona
  }
}

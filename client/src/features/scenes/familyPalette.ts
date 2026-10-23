/**
 * Color de cada familia olfativa en las escenas 3D (la pirámide).
 * Son tonos de la paleta de la marca: dorados, ámbar, rubí y verdes apagados.
 * Una familia que no está en la lista usa el dorado de la marca.
 */
const palette: Record<string, string> = {
  amaderada: '#b07a3c',
  oriental: '#c8783a',
  ambarada: '#c8783a',
  floral: '#d9a0a6',
  citrica: '#e8d27a',
  verde: '#9fb07a',
  aromatica: '#a9b48c',
  almizclada: '#e6d8c4',
  cuero: '#8a5a3c',
  gourmand: '#c99a6a',
  acuatica: '#9ab8c0',
  frutal: '#e0a070',
}

export const BRAND_GOLD = '#c9a54e'

/** "Cítrica" → "citrica": sin tildes ni mayúsculas, para que coincida lo que escriba el panel. */
function normalize(family: string) {
  return family.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

export function familyColor(family?: string) {
  return (family && palette[normalize(family)]) || BRAND_GOLD
}

import { useSyncExternalStore } from 'react'

/*
  "Modo ligero": si una escena 3D va lenta en este dispositivo (ver fpsWatch), se apagan
  las escenas y la tienda sigue con la información sin animación. Se recuerda durante la
  visita (sessionStorage) para no volver a intentarlo en cada sección ni en cada página.
*/

const KEY = 'emirate-scents:escenas-ligeras'
const listeners = new Set<() => void>()
let lowPower = readStored()

function readStored() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY) === 'si'
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): se decide de nuevo en cada visita
    return false
  }
}

export function isLowPower() {
  return lowPower
}

export function markLowPower() {
  if (lowPower) return
  lowPower = true
  try {
    sessionStorage.setItem(KEY, 'si')
  } catch {
    // Sin almacenamiento, el modo ligero dura hasta recargar
  }
  listeners.forEach((listener) => listener())
}

export function useLowPower() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, isLowPower)
}

/*
  Estado de la animación "vuela al carrito": AddToCartButton lanza un vuelo y
  CartFlightLayer (montada en RootLayout) lo dibuja.
*/
import { create } from 'zustand'

interface Flight {
  id: number
  from: { x: number; y: number }
  to: { x: number; y: number }
}

interface FlightState {
  flights: Flight[]
  launch: (flight: Flight) => void
  land: (id: number) => void
}

export const useFlightStore = create<FlightState>()((set) => ({
  flights: [],
  launch: (flight) => set((state) => ({ flights: [...state.flights, flight] })),
  land: (id) => set((state) => ({ flights: state.flights.filter((flight) => flight.id !== id) })),
}))

let nextId = 0

const center = (rect: DOMRect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

/**
 * Lanza un pequeño sello dorado desde `source` (el botón pulsado) hasta el icono del carrito
 * del header. Devuelve false si no hay icono visible: entonces no se anima nada.
 */
export function flyToCart(source: Element) {
  const target = document.querySelector('[data-cart-target]')
  const targetRect = target?.getBoundingClientRect()
  if (!targetRect || targetRect.width === 0) return false
  useFlightStore
    .getState()
    .launch({ id: nextId++, from: center(source.getBoundingClientRect()), to: center(targetRect) })
  return true
}

/** Duración del vuelo en segundos: quien lo lanza puede esperar a que aterrice. */
export const FLIGHT_SECONDS = 0.7

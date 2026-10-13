import { ShoppingBag } from 'lucide-react'
import { m } from 'motion/react'
import { FLIGHT_SECONDS, useFlightStore } from './cartFlight'

/** Capa que dibuja los vuelos en curso. Se monta una sola vez (RootLayout). */
export function CartFlightLayer() {
  const flights = useFlightStore((state) => state.flights)
  const land = useFlightStore((state) => state.land)

  return flights.map(({ id, from, to }) => (
    <m.span
      key={id}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[60] -mt-5 -ml-5 grid size-10 place-items-center rounded-full bg-gold-500 text-ink-950 shadow-[0_8px_24px_rgb(201_165_78/0.5)]"
      initial={{ x: from.x, y: from.y, scale: 0.6, opacity: 0 }}
      // Una curva: sube un poco (sin salir de la pantalla) y cae sobre el icono del carrito
      animate={{
        x: [from.x, (from.x + to.x) / 2, to.x],
        y: [from.y, Math.max(Math.min(from.y, to.y) - 80, 24), to.y],
        scale: [0.6, 1.1, 0.35],
        opacity: [0, 1, 0.9],
      }}
      transition={{ duration: FLIGHT_SECONDS, ease: [0.45, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        land(id)
        // Al aterrizar, el icono del carrito da un pequeño salto
        document
          .querySelector('[data-cart-target]')
          ?.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
            { duration: 350, easing: 'ease-out' },
          )
      }}
    >
      <ShoppingBag className="size-4" strokeWidth={2} />
    </m.span>
  ))
}

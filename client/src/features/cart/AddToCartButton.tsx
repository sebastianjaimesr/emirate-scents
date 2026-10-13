import { Check, ShoppingBag } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import type { Product } from '../../types/product'
import { FLIGHT_SECONDS, flyToCart } from './cartFlight'
import { useCartStore } from './cartStore'

/**
 * Agrega el producto al carrito, muestra una confirmación breve, lo hace volar hasta el icono
 * del carrito y abre el panel.
 */
export function AddToCartButton({ product, quantity }: { product: Product; quantity: number }) {
  const addItem = useCartStore((state) => state.addItem)
  const openDrawer = useCartStore((state) => state.openDrawer)
  const [justAdded, setJustAdded] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const isSoldOut = product.stock <= 0

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    addItem(product.id, quantity, product.stock)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
    // Primero el producto "vuela" al icono del carrito; al llegar, se abre el panel
    if (!prefersReducedMotion && flyToCart(event.currentTarget)) {
      window.setTimeout(openDrawer, FLIGHT_SECONDS * 1000)
    } else {
      openDrawer()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSoldOut}
      className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-gold-500 px-7 text-sm font-semibold tracking-[0.08em] text-ink-950 uppercase transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-ink-900/10 disabled:text-smoke-500"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={justAdded ? 'added' : 'idle'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-3"
        >
          {justAdded ? (
            <>
              <Check aria-hidden="true" className="size-5" strokeWidth={2} /> Agregado
            </>
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-5" strokeWidth={1.5} />
              {isSoldOut ? 'Agotado' : 'Agregar al carrito'}
            </>
          )}
        </m.span>
      </AnimatePresence>
    </button>
  )
}

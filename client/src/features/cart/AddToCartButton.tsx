import { Check, ShoppingBag } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import type { Product } from '../../types/product'
import { FLIGHT_SECONDS, flyToCart } from './cartFlight'
import { useCartStore } from './cartStore'

const styles = {
  full: 'min-h-14 w-full gap-3 px-7 text-sm',
  // Tarjetas de producto: más pequeño, por encima del enlace que cubre la tarjeta (z-10)
  compact: 'relative z-10 min-h-11 gap-2 px-4 text-[0.7rem]',
} as const

/**
 * Agrega el producto al carrito, muestra una confirmación breve, lo hace volar hasta el icono
 * del carrito y abre el panel.
 */
export function AddToCartButton({
  product,
  quantity,
  variant = 'full',
  className = '',
}: {
  product: Product
  quantity: number
  /** compact: botón de las tarjetas; a los lectores de pantalla les dice de qué producto es */
  variant?: keyof typeof styles
  className?: string
}) {
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
      className={`btn-sheen inline-flex items-center justify-center bg-gold-500 font-semibold tracking-[0.08em] text-ink-950 uppercase transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-ink-900/10 disabled:text-smoke-500 ${styles[variant]} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={justAdded ? 'added' : 'idle'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-[inherit]"
        >
          {justAdded ? (
            <>
              <Check
                aria-hidden="true"
                className={variant === 'full' ? 'size-5' : 'size-4'}
                strokeWidth={2}
              />{' '}
              Agregado
            </>
          ) : (
            <>
              <ShoppingBag
                aria-hidden="true"
                className={variant === 'full' ? 'size-5' : 'size-4'}
                strokeWidth={1.5}
              />
              {isSoldOut ? 'Agotado' : variant === 'full' ? 'Agregar al carrito' : 'Agregar'}
              {variant === 'compact' && (
                // Para lectores de pantalla: "Agregar Khamrah al carrito"
                <span className="sr-only">
                  {isSoldOut ? `: ${product.name}` : ` ${product.name} al carrito`}
                </span>
              )}
            </>
          )}
        </m.span>
      </AnimatePresence>
    </button>
  )
}

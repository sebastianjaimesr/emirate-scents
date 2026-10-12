import { ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Drawer } from '../../components/ui/Drawer'
import { CartLineItem } from './CartLineItem'
import { useCartStore } from './cartStore'
import { CartSummary } from './CartSummary'
import { useCartDetails } from './useCartDetails'

function CartDrawerContent() {
  const closeDrawer = useCartStore((state) => state.closeDrawer)
  const { lines, subtotal, hasDemoProducts, hasSoldOut, isLoading, loadError, isEmpty } =
    useCartDetails()

  return (
    <Drawer
      ariaLabel="Carrito de compras"
      title={<span className="font-display text-2xl">Tu carrito</span>}
      onClose={closeDrawer}
      footer={
        !isEmpty &&
        !isLoading &&
        !loadError && (
          <div className="space-y-3">
            <CartSummary
              lines={lines}
              subtotal={subtotal}
              hasDemoProducts={hasDemoProducts}
              hasSoldOut={hasSoldOut}
              onCheckout={closeDrawer}
            />
            <Link
              to="/carrito"
              onClick={closeDrawer}
              className="block text-center text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase underline-offset-4 hover:underline"
            >
              Ver carrito completo
            </Link>
          </div>
        )
      }
    >
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <span className="grid size-16 place-items-center rounded-full border border-gold-700/30 text-gold-700">
            <ShoppingBag className="size-7" strokeWidth={1.25} />
          </span>
          <p className="mt-6 font-display text-3xl text-ink-950">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-smoke-500">Descubre fragancias y agrégalas aquí.</p>
          <ButtonLink to="/catalogo" className="mt-8">
            Explorar catálogo
          </ButtonLink>
        </div>
      ) : loadError ? (
        <div className="p-5 text-sm text-smoke-500" role="alert">
          <p>No pudimos cargar tu carrito. Tus productos siguen guardados en este navegador.</p>
          <button
            type="button"
            onClick={loadError}
            className="mt-4 min-h-10 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase underline-offset-4 hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : isLoading ? (
        <p className="p-5 text-sm text-smoke-500" role="status">
          Cargando tu carrito…
        </p>
      ) : (
        <ul className="divide-y divide-sand-300 px-5">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.product.id}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24, height: 0, paddingBlock: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden py-5"
              >
                <CartLineItem line={line} onNavigate={closeDrawer} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  )
}

/** Panel lateral del carrito. Se monta una vez en RootLayout y se abre desde cualquier página. */
export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isDrawerOpen)
  return <AnimatePresence>{isOpen && <CartDrawerContent />}</AnimatePresence>
}

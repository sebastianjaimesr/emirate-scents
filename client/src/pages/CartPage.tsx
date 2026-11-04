/**
 * Página del carrito de compras (/carrito).
 */
import { ShoppingBag } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadError } from '../components/ui/LoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { CartLineItem } from '../features/cart/CartLineItem'
import { useCartStore } from '../features/cart/cartStore'
import { CartSummary } from '../features/cart/CartSummary'
import { useCartDetails } from '../features/cart/useCartDetails'

/** Página del carrito: líneas, avisos, resumen y botones para vaciar o continuar con la compra. */
export function CartPage() {
  const clear = useCartStore((state) => state.clear)
  const { lines, subtotal, hasDemoProducts, hasSoldOut, isLoading, loadError, isEmpty } =
    useCartDetails()

  return (
    <>
      <PageMeta title="Carrito" description="Tu carrito de compras en Emirate Scents." />
      <PageHeader eyebrow="Tu pedido" title="Carrito" />
      <Container>
        {isEmpty ? (
          <EmptyState
            icon={<ShoppingBag className="size-8" strokeWidth={1.25} />}
            title="Tu carrito está vacío"
            description="Cuando agregues fragancias, aquí verás el resumen de tu pedido antes de consultarlo por WhatsApp."
            actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
          />
        ) : loadError ? (
          <LoadError
            title="No pudimos cargar tu carrito"
            description="Tus productos siguen guardados en este navegador. Revisa tu conexión e intenta de nuevo."
            onRetry={loadError}
          />
        ) : isLoading ? (
          <p role="status" className="py-20 text-center text-smoke-500">
            Cargando tu carrito…
          </p>
        ) : (
          <div className="grid gap-12 py-12 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:py-16">
            <section aria-labelledby="cart-items-title">
              <div className="flex items-baseline justify-between border-b border-sand-300 pb-4">
                <h2 id="cart-items-title" className="text-3xl text-ink-950">
                  Productos
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Quieres vaciar el carrito?')) clear()
                  }}
                  className="min-h-10 text-xs font-semibold tracking-[0.12em] text-smoke-500 uppercase hover:text-ruby-600"
                >
                  Vaciar carrito
                </button>
              </div>
              <ul className="divide-y divide-sand-300">
                <AnimatePresence initial={false}>
                  {lines.map((line) => (
                    <m.li
                      key={line.product.id}
                      layout
                      exit={{ opacity: 0, height: 0, paddingBlock: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden py-6"
                    >
                      <CartLineItem line={line} />
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>

            <aside aria-label="Resumen del pedido" className="lg:sticky lg:top-28 lg:self-start">
              <div className="bg-cream-100 p-6 sm:p-8">
                <h2 className="mb-6 text-3xl text-ink-950">Resumen</h2>
                <CartSummary
                  lines={lines}
                  subtotal={subtotal}
                  hasDemoProducts={hasDemoProducts}
                  hasSoldOut={hasSoldOut}
                />
              </div>
            </aside>
          </div>
        )}
      </Container>
    </>
  )
}

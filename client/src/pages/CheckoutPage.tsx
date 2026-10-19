/**
 * Página para finalizar la compra (/finalizar-compra).
 */
import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ProductImage } from '../components/products/ProductImage'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadError } from '../components/ui/LoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { useCartStore } from '../features/cart/cartStore'
import { getCartBlockingReason } from '../features/cart/cartItems'
import { CartTotals } from '../features/cart/CartSummary'
import { useCartDetails } from '../features/cart/useCartDetails'
import { CheckoutForm } from '../features/checkout/CheckoutForm'
import { normalizeColombianMobile, type CheckoutData } from '../features/checkout/checkoutSchema'
import { saveLastOrder } from '../features/checkout/lastOrder'
import { formatCOP } from '../lib/formatCOP'
import { ApiError } from '../services/apiClient'
import { createOrder } from '../services/orderService'
import type { UnavailableItem, UnavailableReason } from '../types/order'

const reasonText: Record<UnavailableReason, (available?: number) => string> = {
  NOT_FOUND: () => 'ya no está disponible en el catálogo',
  DEMO_PRODUCT: () => 'es un producto DEMO y no está a la venta',
  SOLD_OUT: () => 'se agotó',
  INSUFFICIENT_STOCK: (available) =>
    `solo tiene ${available} ${available === 1 ? 'unidad disponible' : 'unidades disponibles'}`,
}

/** Formulario de pedido (/pedido): datos de entrega + resumen del carrito. */
export function CheckoutPage() {
  const navigate = useNavigate()
  const clearCart = useCartStore((state) => state.clear)
  const { lines, subtotal, hasDemoProducts, hasSoldOut, isLoading, loadError, isEmpty, refresh } =
    useCartDetails()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string[] | null>(null)

  async function submit(data: CheckoutData) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const order = await createOrder({
        customer: {
          name: data.name,
          phone: normalizeColombianMobile(data.phone),
          department: data.department,
          city: data.city,
          address: data.address,
          notes: data.notes || undefined,
        },
        paymentMethod: data.paymentMethod,
        // Solo ids y cantidades: el servidor pone los precios
        items: lines
          .filter((line) => line.quantity > 0)
          .map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        dataConsent: true,
        website: data.website,
      })
      const delivery = { address: data.address, notes: data.notes || undefined }
      saveLastOrder({ order, delivery })
      navigate('/pedido/confirmacion', { replace: true, state: { order, delivery } })
      clearCart()
    } catch (error) {
      setSubmitError(describeSubmitError(error))
      // Precios o existencias pudieron cambiar: se vuelven a cargar para mostrarlos al día
      if (error instanceof ApiError && error.code === 'ITEMS_UNAVAILABLE') refresh()
      setIsSubmitting(false)
    }
  }

  function describeSubmitError(error: unknown): string[] {
    if (!(error instanceof ApiError) || error.status === 0) {
      return ['No pudimos enviar tu pedido. Revisa tu conexión e intenta de nuevo.']
    }
    if (error.code === 'ITEMS_UNAVAILABLE' && Array.isArray(error.items)) {
      const names = new Map(lines.map((line) => [line.product.id, line.product.name]))
      return [
        'Algunos productos cambiaron desde que los agregaste:',
        ...(error.items as UnavailableItem[]).map(
          (item) =>
            `${names.get(item.productId) ?? 'Un producto'} ${reasonText[item.reason](item.available)}.`,
        ),
        'Ajusta tu carrito y vuelve a intentarlo.',
      ]
    }
    return [error.message]
  }

  const content = isEmpty ? (
    <EmptyState
      icon={<ShoppingBag className="size-8" strokeWidth={1.25} />}
      title="Tu carrito está vacío"
      description="Agrega fragancias a tu carrito para registrar un pedido."
      actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
    />
  ) : loadError ? (
    <LoadError title="No pudimos cargar tu carrito" onRetry={loadError} />
  ) : isLoading ? (
    <p role="status" className="py-20 text-center text-smoke-500">
      Cargando tu pedido…
    </p>
  ) : (
    <div className="grid gap-12 py-12 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-16">
      <div className="min-w-0">
        {submitError && (
          <div
            role="alert"
            className="mb-8 border border-ruby-600/30 bg-ruby-600/5 px-4 py-3 text-sm leading-relaxed text-ink-900"
          >
            {submitError.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
        <CheckoutForm
          blockingReason={getCartBlockingReason(hasDemoProducts, hasSoldOut)}
          isSubmitting={isSubmitting}
          onSubmit={submit}
        />
      </div>

      <aside aria-label="Resumen del pedido" className="lg:sticky lg:top-28 lg:self-start">
        <div className="bg-cream-100 p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-3xl text-ink-950">Tu pedido</h2>
            <Link
              to="/carrito"
              className="text-xs font-semibold tracking-[0.12em] text-gold-700 uppercase hover:underline"
            >
              Editar
            </Link>
          </div>
          <ul className="mb-6 divide-y divide-sand-300 border-y border-sand-300">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center gap-4 py-4">
                <div className="relative w-14 shrink-0">
                  <div className="aspect-[4/5] overflow-hidden">
                    <ProductImage
                      image={line.product.images[0]}
                      fallbackLabel={line.product.name}
                      compact
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-ink-950 text-[0.65rem] font-semibold text-gold-300 tabular-nums">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight text-ink-950">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-smoke-500">
                    {line.product.brand.name}
                    {line.product.sizeMl ? ` · ${line.product.sizeMl} ml` : ''}
                    {line.product.isDemo ? ' · DEMO' : ''}
                    {line.status === 'sold-out' ? ' · Agotado' : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink-950 tabular-nums">
                  {formatCOP(line.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <CartTotals subtotal={subtotal} />
          <p className="mt-5 text-xs leading-relaxed text-smoke-500">
            Los precios se confirman con nuestro catálogo al registrar el pedido. El envío se cotiza
            por WhatsApp según tu ciudad.
          </p>
        </div>
      </aside>
    </div>
  )

  return (
    <>
      <PageMeta title="Pedido" description="Registra tu pedido en Emirate Scents." />
      <PageHeader
        eyebrow="Último paso"
        title="Tu pedido"
        lead="Déjanos tus datos de entrega. Registramos el pedido y lo confirmamos contigo por WhatsApp."
      />
      <Container>{content}</Container>
    </>
  )
}

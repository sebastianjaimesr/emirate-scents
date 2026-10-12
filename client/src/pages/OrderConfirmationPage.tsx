import { CircleCheck, Receipt } from 'lucide-react'
import { useLocation } from 'react-router'
import { WhatsAppIcon } from '../components/brand/BrandIcons'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageMeta } from '../components/ui/PageMeta'
import { Reveal } from '../components/ui/Reveal'
import { readLastOrder, type LastOrder } from '../features/checkout/lastOrder'
import { formatCOP } from '../lib/formatCOP'
import { buildOrderMessage, buildWhatsAppUrl } from '../lib/whatsapp'
import { paymentMethodLabels } from '../types/order'

/** Pedido registrado (/pedido/confirmacion): número, resumen y envío por WhatsApp. */
export function OrderConfirmationPage() {
  const location = useLocation()
  const lastOrder = (location.state as LastOrder | null) ?? readLastOrder()

  if (!lastOrder) {
    return (
      <Container>
        <PageMeta title="Pedido" description="Confirmación de pedido en Emirate Scents." />
        <EmptyState
          icon={<Receipt className="size-8" strokeWidth={1.25} />}
          title="No hay un pedido reciente"
          description="No encontramos un pedido registrado en esta pestaña. Si ya enviaste uno, escríbenos por WhatsApp con tu número de pedido."
          actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
        />
      </Container>
    )
  }

  const { order, delivery } = lastOrder
  const whatsappUrl = buildWhatsAppUrl(buildOrderMessage(order, delivery))

  return (
    <>
      <PageMeta
        title={`Pedido ${order.orderNumber}`}
        description="Tu pedido quedó registrado y está pendiente de confirmación."
      />
      <div className="bg-ink-950 text-ivory-50">
        <Container className="py-16 text-center sm:py-20">
          <Reveal>
            <CircleCheck
              aria-hidden="true"
              className="mx-auto size-12 text-gold-500"
              strokeWidth={1.25}
            />
            <p className="eyebrow mt-6 text-gold-500">Pedido {order.orderNumber}</p>
            <h1 className="mt-4 text-5xl leading-none sm:text-6xl">Pedido registrado</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-smoke-300">
              Está <strong className="text-ivory-50">pendiente de confirmación</strong>. Envíanos el
              resumen por WhatsApp y te confirmaremos disponibilidad, costo de envío y pago.
            </p>
          </Reveal>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-3xl gap-10">
          <div className="text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-gold-500 px-8 text-sm font-semibold tracking-[0.1em] text-ink-950 uppercase transition-colors hover:bg-gold-300 sm:w-auto"
            >
              <WhatsAppIcon className="size-5" />
              Enviar pedido por WhatsApp
            </a>
            <p className="mt-3 text-xs text-smoke-500">
              Se abrirá WhatsApp con el mensaje listo; solo tienes que pulsar Enviar.
            </p>
          </div>

          <section aria-labelledby="order-summary-title" className="bg-cream-100 p-6 sm:p-8">
            <h2 id="order-summary-title" className="text-3xl text-ink-950">
              Resumen
            </h2>
            <ul className="mt-6 divide-y divide-sand-300 border-y border-sand-300">
              {order.items.map((item) => (
                <li key={item.sku} className="flex items-baseline justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight text-ink-950">{item.name}</p>
                    <p className="text-xs text-smoke-500">
                      {item.brandName}
                      {item.sizeMl ? ` · ${item.sizeMl} ml` : ''} · {item.quantity} ×{' '}
                      {formatCOP(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink-950 tabular-nums">
                    {formatCOP(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-smoke-500">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatCOP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-smoke-500">Envío</dt>
                <dd>
                  {order.shippingCost === null
                    ? 'Pendiente de cotización'
                    : formatCOP(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-sand-300 pt-3 text-base">
                <dt className="font-semibold">Total estimado</dt>
                <dd className="font-semibold tabular-nums">{formatCOP(order.total)}</dd>
              </div>
            </dl>
            <dl className="mt-6 grid gap-4 border-t border-sand-300 pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                  Entrega
                </dt>
                <dd className="mt-1 text-ink-900">
                  {order.customer.name}
                  <br />
                  {delivery.address}
                  <br />
                  {order.customer.city}, {order.customer.department}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                  Forma de pago
                </dt>
                <dd className="mt-1 text-ink-900">{paymentMethodLabels[order.paymentMethod]}</dd>
              </div>
            </dl>
          </section>

          <div className="text-center">
            <ButtonLink to="/catalogo" variant="outline-light">
              Seguir explorando
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  )
}

import { ArrowRight, Info } from 'lucide-react'
import { Link } from 'react-router'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { formatCOP } from '../../lib/formatCOP'
import { buildCartInquiryMessage, buildWhatsAppUrl } from '../../lib/whatsapp'
import { getCartBlockingReason, type CartLine } from './cartItems'

/** Subtotal, envío y total estimado. */
export function CartTotals({ subtotal }: { subtotal: number }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-smoke-500">Subtotal</dt>
        <dd className="font-semibold text-ink-950 tabular-nums">{formatCOP(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-smoke-500">Envío</dt>
        <dd className="text-ink-900">Pendiente de cotización</dd>
      </div>
      <div className="flex justify-between border-t border-sand-300 pt-3 text-base">
        <dt className="font-semibold text-ink-950">Total estimado</dt>
        <dd className="font-semibold text-ink-950 tabular-nums">{formatCOP(subtotal)}</dd>
      </div>
    </dl>
  )
}

interface CartSummaryProps {
  lines: CartLine[]
  subtotal: number
  hasDemoProducts: boolean
  hasSoldOut: boolean
  /** Se llama al ir al formulario de pedido (por ejemplo, para cerrar el panel lateral). */
  onCheckout?: () => void
}

/** Resumen del carrito: botón para continuar con el pedido y consulta por WhatsApp. */
export function CartSummary({
  lines,
  subtotal,
  hasDemoProducts,
  hasSoldOut,
  onCheckout,
}: CartSummaryProps) {
  const blockingReason = getCartBlockingReason(hasDemoProducts, hasSoldOut)

  return (
    <div className="space-y-4">
      <CartTotals subtotal={subtotal} />

      {blockingReason ? (
        <>
          <p
            role="alert"
            className="border border-ruby-600/30 bg-ruby-600/5 px-3 py-2 text-xs leading-relaxed text-ink-900"
          >
            {blockingReason}
          </p>
          <button
            type="button"
            disabled
            className="inline-flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 bg-ink-900/10 text-sm font-semibold tracking-[0.08em] text-smoke-500 uppercase"
          >
            Continuar con el pedido
          </button>
        </>
      ) : (
        <Link
          to="/pedido"
          onClick={onCheckout}
          className="group inline-flex min-h-14 w-full items-center justify-center gap-3 bg-ink-950 text-sm font-semibold tracking-[0.08em] text-gold-300 uppercase transition-colors hover:bg-ink-800"
        >
          Continuar con el pedido
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-1"
            strokeWidth={1.75}
          />
        </Link>
      )}

      {/* Los productos DEMO no existen: no tiene sentido consultarlos */}
      {!hasDemoProducts && (
        <a
          href={buildWhatsAppUrl(buildCartInquiryMessage(lines, subtotal))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 text-xs font-semibold tracking-[0.12em] text-gold-700 uppercase underline-offset-4 hover:underline"
        >
          <WhatsAppIcon className="size-4" />
          ¿Dudas? Consultar por WhatsApp
        </a>
      )}

      <p className="flex gap-2 text-xs leading-relaxed text-smoke-500">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        El total es estimado. Confirmamos precios, disponibilidad, envío y pago contra entrega por
        WhatsApp antes de despachar.
      </p>
    </div>
  )
}

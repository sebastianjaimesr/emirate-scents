import { Info } from 'lucide-react'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { formatCOP } from '../../lib/formatCOP'
import { buildCartInquiryMessage, buildWhatsAppUrl } from '../../lib/whatsapp'
import type { CartLine } from './cartItems'

interface CartSummaryProps {
  lines: CartLine[]
  subtotal: number
  hasDemoProducts: boolean
  hasSoldOut: boolean
}

/** Resumen del carrito y envío de la consulta por WhatsApp. */
export function CartSummary({ lines, subtotal, hasDemoProducts, hasSoldOut }: CartSummaryProps) {
  const blockingReason = hasDemoProducts
    ? 'Tu carrito tiene productos DEMO, que no están a la venta. Retíralos para enviar un pedido real.'
    : hasSoldOut
      ? 'Retira los productos agotados para continuar.'
      : null

  return (
    <div className="space-y-4">
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
            <WhatsAppIcon className="size-5" />
            Consultar por WhatsApp
          </button>
        </>
      ) : (
        <a
          href={buildWhatsAppUrl(buildCartInquiryMessage(lines, subtotal))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-ink-950 text-sm font-semibold tracking-[0.08em] text-gold-300 uppercase transition-colors hover:bg-ink-800"
        >
          <WhatsAppIcon className="size-5" />
          Consultar por WhatsApp
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

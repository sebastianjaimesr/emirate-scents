import { Info } from 'lucide-react'
import { useState } from 'react'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { formatCOP } from '../../lib/formatCOP'
import { buildProductInquiryMessage, buildWhatsAppUrl } from '../../lib/whatsapp'
import type { Product } from '../../types/product'
import { QuantitySelector } from './QuantitySelector'

/**
 * Cantidad y pedido por WhatsApp.
 * - Productos DEMO: el botón queda desactivado (no están a la venta).
 * - Productos agotados: no se puede pedir; se ofrece consultar por WhatsApp.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const isSoldOut = product.stock <= 0
  const canOrder = !product.isDemo && !isSoldOut
  const whatsappUrl = buildWhatsAppUrl(buildProductInquiryMessage(product, quantity))

  return (
    <div className="space-y-5">
      {!isSoldOut && (
        <div className="flex flex-wrap items-center gap-4">
          <QuantitySelector
            value={quantity}
            max={product.stock}
            onChange={setQuantity}
            disabled={!canOrder}
          />
          {quantity > 1 && (
            <p className="text-sm text-smoke-500 tabular-nums">
              Subtotal estimado:{' '}
              <span className="font-semibold text-ink-950">
                {formatCOP(product.price * quantity)}
              </span>
            </p>
          )}
        </div>
      )}

      {canOrder ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-ink-950 px-7 text-sm font-semibold tracking-[0.08em] text-gold-300 uppercase transition-colors hover:bg-ink-800"
        >
          <WhatsAppIcon className="size-5" />
          Pedir por WhatsApp
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-3 bg-ink-900/10 px-7 text-sm font-semibold tracking-[0.08em] text-smoke-500 uppercase"
        >
          <WhatsAppIcon className="size-5" />
          {product.isDemo ? 'No disponible: producto DEMO' : 'Agotado'}
        </button>
      )}

      <p className="flex gap-2 text-xs leading-relaxed text-smoke-500">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        {product.isDemo
          ? 'Este producto es una demostración y no se puede pedir.'
          : 'Se abrirá WhatsApp con tu pedido escrito; tú decides cuándo enviarlo. El pedido queda pendiente hasta que confirmemos disponibilidad y condiciones de entrega.'}
      </p>
    </div>
  )
}

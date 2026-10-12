import { Info } from 'lucide-react'
import { useState } from 'react'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { formatCOP } from '../../lib/formatCOP'
import { AddToCartButton } from '../cart/AddToCartButton'
import { MAX_QUANTITY_PER_ITEM } from '../cart/cartItems'
import { FavoriteButton } from '../favorites/FavoriteButton'
import { buildProductInquiryMessage, buildWhatsAppUrl } from '../../lib/whatsapp'
import type { Product } from '../../types/product'
import { QuantitySelector } from '../../components/ui/QuantitySelector'

/**
 * Cantidad, carrito, favoritos y pedido directo por WhatsApp.
 * - Productos DEMO: se pueden agregar al carrito para probarlo, pero el pedido
 *   por WhatsApp queda desactivado (no están a la venta).
 * - Productos agotados: no se pueden agregar ni pedir.
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
            max={Math.min(product.stock, MAX_QUANTITY_PER_ITEM)}
            onChange={setQuantity}
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

      <div className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton product={product} quantity={quantity} />
        </div>
        <FavoriteButton productId={product.id} productName={product.name} variant="outline" />
      </div>

      {canOrder ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 border border-ink-950 px-7 text-sm font-semibold tracking-[0.08em] text-ink-950 uppercase transition-colors hover:bg-ink-950 hover:text-gold-300"
        >
          <WhatsAppIcon className="size-5" />
          Pedir ahora por WhatsApp
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
          ? 'Producto de demostración: puedes agregarlo al carrito para probar la tienda, pero no se puede pedir.'
          : 'Se abrirá WhatsApp con tu pedido escrito; tú decides cuándo enviarlo. El pedido queda pendiente hasta que confirmemos disponibilidad y condiciones de entrega.'}
      </p>
    </div>
  )
}

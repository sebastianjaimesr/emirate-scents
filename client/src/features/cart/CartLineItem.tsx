import { X } from 'lucide-react'
import { Link } from 'react-router'
import { DemoBadge } from '../../components/products/ProductBadges'
import { ProductImage } from '../../components/products/ProductImage'
import { QuantitySelector } from '../../components/ui/QuantitySelector'
import { formatCOP } from '../../lib/formatCOP'
import { MAX_QUANTITY_PER_ITEM, type CartLine } from './cartItems'
import { useCartStore } from './cartStore'

/** Una línea del carrito: producto, cantidad, importe y avisos de inventario. */
export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const { product } = line
  const productUrl = `/producto/${product.slug}`

  return (
    <div className="grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[6rem_1fr]">
      <Link
        to={productUrl}
        onClick={onNavigate}
        className="block aspect-[4/5] overflow-hidden"
        tabIndex={-1}
      >
        <ProductImage image={product.images[0]} fallbackLabel={product.name} compact />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold tracking-[0.16em] text-gold-700 uppercase">
              {product.brand.name}
            </p>
            <Link
              to={productUrl}
              onClick={onNavigate}
              className="mt-0.5 block font-display text-xl leading-tight text-ink-950 hover:text-gold-700"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-xs text-smoke-500">
              {[product.sizeMl && `${product.sizeMl} ml`, formatCOP(product.price)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {product.isDemo && <DemoBadge className="mt-2" />}
          </div>
          <button
            type="button"
            onClick={() => removeItem(product.id)}
            aria-label={`Eliminar ${product.name} del carrito`}
            className="-mt-2 -mr-2 grid size-10 shrink-0 place-items-center text-smoke-500 transition-colors hover:text-ink-950"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {line.status === 'sold-out' ? (
          <p className="mt-3 text-sm font-semibold text-ruby-600">
            Agotado: retíralo para continuar.
          </p>
        ) : (
          <div className="mt-3 flex items-end justify-between gap-3">
            <QuantitySelector
              size="sm"
              label={`Cantidad de ${product.name}`}
              value={line.quantity}
              max={Math.min(product.stock, MAX_QUANTITY_PER_ITEM)}
              onChange={(quantity) => setQuantity(product.id, quantity, product.stock)}
            />
            <p className="text-sm font-semibold text-ink-950 tabular-nums">
              {formatCOP(line.lineTotal)}
            </p>
          </div>
        )}
        {line.status === 'reduced' && (
          <p className="mt-2 text-xs text-amber-600">
            Solo hay {line.quantity} disponibles; ajustamos la cantidad.
          </p>
        )}
      </div>
    </div>
  )
}

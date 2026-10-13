import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDateTime, formatQuantity } from '../format'
import { movementLabels, type Movement } from '../types'
import { Badge } from './ui'

/** Tabla del historial de inventario (solo lectura: el historial no se edita). */
export function MovementsTable({
  movements,
  showProduct = true,
}: {
  movements: Movement[]
  showProduct?: boolean
}) {
  if (movements.length === 0) {
    return <p className="text-sm text-smoke-500">Todavía no hay movimientos.</p>
  }
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-ink-900/10 text-xs text-smoke-500">
          <tr>
            <th scope="col" className="px-5 py-2 font-semibold sm:px-2">
              Fecha
            </th>
            {showProduct && (
              <th scope="col" className="px-2 py-2 font-semibold">
                Producto
              </th>
            )}
            <th scope="col" className="px-2 py-2 font-semibold">
              Tipo
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Cantidad
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Quedan
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Motivo
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Por
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/5">
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="px-5 py-2 whitespace-nowrap text-smoke-500 sm:px-2">
                {formatDateTime(movement.createdAt)}
              </td>
              {showProduct && (
                <td className="px-2 py-2">
                  <Link to={`/admin/productos/${movement.product.id}`} className="hover:underline">
                    {movement.product.name}
                  </Link>
                </td>
              )}
              <td className="px-2 py-2">
                <Badge tone={movement.quantity > 0 ? 'success' : 'warning'}>
                  {movementLabels[movement.type]}
                </Badge>
              </td>
              <td
                className={cx(
                  'px-2 py-2 text-right font-semibold tabular-nums',
                  movement.quantity > 0 ? 'text-emerald-800' : 'text-ruby-600',
                )}
              >
                {formatQuantity(movement.quantity)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{movement.stockAfter}</td>
              <td className="px-2 py-2">
                {movement.orderId ? (
                  <Link to={`/admin/pedidos/${movement.orderId}`} className="hover:underline">
                    {movement.reason}
                  </Link>
                ) : (
                  movement.reason
                )}
              </td>
              <td className="px-2 py-2 text-smoke-500">{movement.adminName ?? 'Sistema'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

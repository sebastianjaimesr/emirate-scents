/**
 * Página con la lista de pedidos del panel.
 */
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { cx } from '../../lib/cx'
import { formatCOP } from '../../lib/formatCOP'
import { adminApi, errorMessage } from '../adminApi'
import { Alert, Badge, Button, Loading, PageTitle, Pager, Panel } from '../components/ui'
import { formatDateTime } from '../format'
import {
  orderStatusLabels,
  orderStatusTone,
  type OrderStatus,
  type OrdersPage as OrdersResponse,
} from '../types'

const statuses = Object.keys(orderStatusLabels) as OrderStatus[]

/** Lista de pedidos: búsqueda y pestañas por estado. Los filtros viven en la dirección. */
export function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const query = {
    q: params.get('q') ?? '',
    estado: params.get('estado') ?? '',
    pagina: Number(params.get('pagina') ?? 1),
  }
  const [search, setSearch] = useState(query.q)

  const orders = useAsyncData(`pedidos?${params}`, () =>
    adminApi.get<OrdersResponse>('/orders', { ...query, porPagina: 25 }),
  )

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('pagina' in changes)) next.delete('pagina')
    setParams(next)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    update({ q: search.trim() })
  }

  const data = orders.data ?? orders.previousData
  const counts = data?.countsByStatus ?? {}
  const allCount = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)
  const tabs = [
    { value: '', label: 'Todos', count: allCount },
    ...statuses.map((status) => ({
      value: status,
      label: orderStatusLabels[status],
      count: counts[status] ?? 0,
    })),
  ]

  return (
    <>
      <PageTitle
        title="Pedidos"
        description="Los pedidos de la tienda llegan aquí como pendientes. Confírmalos después de hablar con el cliente por WhatsApp."
      />

      <Panel>
        <form role="search" onSubmit={submitSearch} className="mb-4 flex gap-2">
          <label htmlFor="buscar-pedido" className="sr-only">
            Buscar por número, cliente, celular o ciudad
          </label>
          <input
            id="buscar-pedido"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, cliente, celular o ciudad"
            className="w-full rounded-md border border-ink-900/20 bg-white px-3 py-2 text-sm"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <nav aria-label="Filtrar por estado" className="-mx-1 mb-4 flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = query.estado === tab.value
            return (
              <button
                key={tab.value || 'todos'}
                type="button"
                aria-pressed={active}
                onClick={() => update({ estado: tab.value })}
                className={cx(
                  'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  active ? 'bg-ink-900 text-ivory-50' : 'text-ink-900 hover:bg-ink-900/5',
                )}
              >
                {tab.label}
                <span
                  className={cx(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    active ? 'bg-white/15' : 'bg-ink-900/8',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>

        {orders.error ? (
          <Alert>{errorMessage(orders.error)}</Alert>
        ) : !data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="py-6 text-sm text-smoke-500">
            {query.q || query.estado
              ? 'No hay pedidos con estos filtros.'
              : 'Todavía no hay pedidos.'}
          </p>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:mx-0" aria-busy={orders.isLoading}>
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-ink-900/10 text-xs text-smoke-500">
                <tr>
                  <th scope="col" className="px-5 py-2 font-semibold sm:px-2">
                    Pedido
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Cliente
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">
                    Unidades
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">
                    Total
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-ivory-50">
                    <td className="px-5 py-2 sm:px-2">
                      <Link
                        to={`/admin/pedidos/${order.id}`}
                        className="font-mono text-xs font-semibold text-ink-950 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="block text-xs text-smoke-500">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {order.customerName}
                      <span className="block text-xs text-smoke-500">
                        {order.city}, {order.department}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{order.units}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCOP(order.total)}
                      {order.shippingCost === null && (
                        <span className="block text-xs text-smoke-500">Envío por cotizar</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={orderStatusTone[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pager
            page={data.page}
            totalPages={data.totalPages}
            onChange={(page) => update({ pagina: String(page) })}
          />
        )}
      </Panel>
    </>
  )
}

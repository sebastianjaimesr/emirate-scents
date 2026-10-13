import { Link } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatCOP } from '../../lib/formatCOP'
import { adminApi, errorMessage } from '../adminApi'
import { MovementsTable } from '../components/MovementsTable'
import { Alert, Badge, Button, Loading, PageTitle, Panel } from '../components/ui'
import { formatDateTime } from '../format'
import { orderStatusLabels, type Dashboard } from '../types'

/**
 * Resumen del negocio. Todas las cifras vienen de la base de datos en el momento de abrir la
 * página; si no hay pedidos, dice 0.
 */
export function DashboardPage() {
  const { data, error, retry } = useAsyncData('dashboard', () =>
    adminApi.get<Dashboard>('/dashboard'),
  )

  if (error)
    return (
      <>
        <PageTitle title="Resumen" />
        <Alert>
          {errorMessage(error)}{' '}
          <Button variant="ghost" onClick={retry}>
            Reintentar
          </Button>
        </Alert>
      </>
    )
  if (!data) return <Loading />

  const { products, orders } = data
  const stats = [
    { label: 'Productos publicados', value: products.byStatus.PUBLICADO ?? 0 },
    { label: 'Borradores', value: products.byStatus.BORRADOR ?? 0 },
    { label: 'Con stock bajo', value: products.lowStockCount, alert: products.lowStockCount > 0 },
    { label: 'Pedidos por confirmar', value: orders.pendingCount, alert: orders.pendingCount > 0 },
  ]

  return (
    <>
      <PageTitle
        title="Resumen"
        description={`Datos al ${formatDateTime(data.generatedAt)}`}
        actions={
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex min-h-10 items-center rounded-md bg-ink-900 px-4 text-sm font-semibold text-ivory-50 hover:bg-ink-800"
          >
            Nuevo producto
          </Link>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-ink-900/10 bg-white p-4">
            <dt className="text-xs font-semibold text-smoke-500">{stat.label}</dt>
            <dd
              className={`mt-1 text-3xl font-bold tabular-nums ${stat.alert ? 'text-ruby-600' : 'text-ink-950'}`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Stock bajo"
          actions={
            <Link to="/admin/productos?stock=bajo" className="text-sm font-semibold underline">
              Ver todos
            </Link>
          }
        >
          {products.lowStock.length === 0 ? (
            <p className="text-sm text-smoke-500">Ningún producto tiene stock bajo.</p>
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {products.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-2">
                  <Link to={`/admin/productos/${product.id}`} className="text-sm hover:underline">
                    <span className="font-mono text-xs text-smoke-500">{product.sku}</span>{' '}
                    {product.name}
                  </Link>
                  <Badge tone={product.stock === 0 ? 'danger' : 'warning'}>
                    {product.stock === 0 ? 'Agotado' : `${product.stock} und.`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pedidos recientes">
          <p className="mb-3 text-sm text-smoke-500">
            Confirmados en los últimos 30 días: <strong>{orders.confirmedLast30Days.count}</strong>{' '}
            ({formatCOP(orders.confirmedLast30Days.total)}). La gestión de pedidos llega en la
            próxima fase.
          </p>
          {orders.recent.length === 0 ? (
            <p className="text-sm text-smoke-500">Todavía no hay pedidos.</p>
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {orders.recent.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="text-sm">
                    <span className="font-mono text-xs">{order.orderNumber}</span> ·{' '}
                    {order.customerName}, {order.city}
                    <span className="block text-xs text-smoke-500">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <Badge tone={order.status === 'PENDIENTE_CONFIRMACION' ? 'warning' : 'neutral'}>
                      {orderStatusLabels[order.status]}
                    </Badge>
                    <span className="mt-1 block">{formatCOP(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Últimos movimientos de inventario"
        className="mt-6"
        actions={
          <Link to="/admin/inventario" className="text-sm font-semibold underline">
            Ver historial
          </Link>
        }
      >
        <MovementsTable movements={data.recentMovements} />
      </Panel>
    </>
  )
}

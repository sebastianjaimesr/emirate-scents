import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminApi, errorMessage } from '../adminApi'
import type { AdminProduct, Movement, Page } from '../types'
import { MovementForm } from './MovementForm'
import { MovementsTable } from './MovementsTable'
import { Alert, Badge, Loading, Panel } from './ui'

/** Existencias del producto: unidades actuales, registrar una entrada o ajuste, historial. */
export function ProductStock({
  product,
  onChange,
}: {
  product: AdminProduct
  onChange: () => void
}) {
  const [version, setVersion] = useState(0)
  const history = useAsyncData(`movimientos:${product.id}:${version}`, () =>
    adminApi.get<Page<Movement>>('/inventory/movements', { producto: product.id, porPagina: 10 }),
  )

  return (
    <Panel
      title="Inventario"
      actions={
        <span className="flex items-center gap-2 text-sm">
          Existencias: <strong className="text-lg tabular-nums">{product.stock}</strong>
          {product.stock === 0 ? (
            <Badge tone="danger">Agotado</Badge>
          ) : (
            product.isLowStock && <Badge tone="warning">Stock bajo</Badge>
          )}
        </span>
      }
    >
      <MovementForm
        fixedProduct={product}
        onSaved={() => {
          setVersion((value) => value + 1)
          onChange()
        }}
      />
      <h3 className="mt-6 mb-2 font-sans text-sm font-bold text-ink-950">Últimos movimientos</h3>
      {history.error ? (
        <Alert>{errorMessage(history.error)}</Alert>
      ) : history.data ? (
        <MovementsTable movements={history.data.items} showProduct={false} />
      ) : (
        <Loading />
      )}
    </Panel>
  )
}

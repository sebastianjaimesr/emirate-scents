import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminApi, errorMessage } from '../adminApi'
import { MovementForm } from '../components/MovementForm'
import { MovementsTable } from '../components/MovementsTable'
import { Alert, Loading, PageTitle, Pager, Panel } from '../components/ui'
import { movementLabels, type AdminProduct, type Movement, type Page } from '../types'

/** Todos los productos, página a página (la API entrega como máximo 100 por petición). */
async function loadAllProducts() {
  const all: AdminProduct[] = []
  for (let page = 1; ; page++) {
    const result = await adminApi.get<Page<AdminProduct>>('/products', {
      orden: 'nombre',
      porPagina: 100,
      pagina: page,
    })
    all.push(...result.items)
    if (page >= result.totalPages) return all
  }
}

/**
 * Página de inventario: productos con su stock, filtro por tipo de movimiento y registro de entradas y ajustes.
 */
export function InventoryPage() {
  const [params, setParams] = useSearchParams()
  const type = params.get('tipo') ?? ''
  const page = Number(params.get('pagina') ?? 1)
  const [version, setVersion] = useState(0)

  const products = useAsyncData('productos-inventario', loadAllProducts)
  const history = useAsyncData(`historial:${type}:${page}:${version}`, () =>
    adminApi.get<Page<Movement>>('/inventory/movements', { tipo: type, pagina: page }),
  )

  const setFilter = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  const data = history.data ?? history.previousData
  // Mientras se recargan las existencias se sigue mostrando la lista anterior: el formulario
  // no se desmonta y conserva el mensaje de confirmación
  const productList = products.data ?? products.previousData

  return (
    <>
      <PageTitle
        title="Inventario"
        description="Las existencias solo cambian con estos movimientos, y el historial no se puede editar ni borrar."
      />
      <Panel title="Registrar entrada o ajuste">
        {products.error ? (
          <Alert>{errorMessage(products.error)}</Alert>
        ) : !productList ? (
          <Loading />
        ) : (
          <MovementForm
            products={productList
              .filter((product) => product.status !== 'ARCHIVADO')
              .map((product) => ({
                id: product.id,
                label: `${product.name} · ${product.sku} (${product.stock} und.)`,
              }))}
            onSaved={() => {
              setVersion((value) => value + 1)
              products.retry()
            }}
          />
        )}
      </Panel>

      <Panel
        title="Historial"
        className="mt-6"
        actions={
          <label className="text-xs font-semibold text-smoke-500">
            Tipo{' '}
            <select
              value={type}
              onChange={(event) => setFilter({ tipo: event.target.value, pagina: '' })}
              className="ml-1 rounded-md border border-ink-900/20 bg-white px-2 py-1.5 text-sm text-ink-950"
            >
              <option value="">Todos</option>
              {Object.entries(movementLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        }
      >
        {history.error ? (
          <Alert>{errorMessage(history.error)}</Alert>
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <MovementsTable movements={data.items} />
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              onChange={(next) => setFilter({ pagina: String(next) })}
            />
          </>
        )}
      </Panel>
    </>
  )
}

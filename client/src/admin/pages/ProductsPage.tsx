import { ImageOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatCOP } from '../../lib/formatCOP'
import { adminApi, errorMessage } from '../adminApi'
import { Alert, Badge, Button, Loading, PageTitle, Pager, Panel } from '../components/ui'
import { statusLabels, type AdminProduct, type Category, type Page } from '../types'

const statusTone = { PUBLICADO: 'success', BORRADOR: 'info', ARCHIVADO: 'neutral' } as const

/** Lista de productos con búsqueda y filtros. Los filtros viven en la dirección (?estado=...). */
export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const query = {
    q: params.get('q') ?? '',
    estado: params.get('estado') ?? '',
    categoria: params.get('categoria') ?? '',
    stock: params.get('stock') ?? '',
    pagina: Number(params.get('pagina') ?? 1),
  }
  const [search, setSearch] = useState(query.q)

  const products = useAsyncData(`productos?${params}`, () =>
    adminApi.get<Page<AdminProduct>>('/products', { ...query, porPagina: 25 }),
  )
  const categories = useAsyncData('categorias', () =>
    adminApi.get<{ items: Category[] }>('/categories'),
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

  const data = products.data ?? products.previousData
  const selectClasses =
    'rounded-md border border-ink-900/20 bg-white px-3 py-2 text-sm focus-visible:outline-gold-500'

  return (
    <>
      <PageTitle
        title="Productos"
        description={data ? `${data.total} producto(s)` : undefined}
        actions={
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex min-h-10 items-center rounded-md bg-ink-900 px-4 text-sm font-semibold text-ivory-50 hover:bg-ink-800"
          >
            Nuevo producto
          </Link>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <form role="search" onSubmit={submitSearch} className="flex min-w-60 flex-1 gap-2">
            <label htmlFor="buscar-producto" className="sr-only">
              Buscar por nombre, marca, nota o SKU
            </label>
            <input
              id="buscar-producto"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, marca, nota o SKU"
              className="w-full rounded-md border border-ink-900/20 bg-white px-3 py-2 text-sm"
            />
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>
          <label className="text-xs font-semibold text-smoke-500">
            Estado
            <select
              value={query.estado}
              onChange={(event) => update({ estado: event.target.value })}
              className={`${selectClasses} mt-1 block`}
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-smoke-500">
            Categoría
            <select
              value={query.categoria}
              onChange={(event) => update({ categoria: event.target.value })}
              className={`${selectClasses} mt-1 block`}
            >
              <option value="">Todas</option>
              {categories.data?.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-smoke-500">
            Existencias
            <select
              value={query.stock}
              onChange={(event) => update({ stock: event.target.value })}
              className={`${selectClasses} mt-1 block`}
            >
              <option value="">Todas</option>
              <option value="bajo">Stock bajo</option>
              <option value="agotado">Agotados</option>
            </select>
          </label>
        </div>

        {products.error ? (
          <Alert>{errorMessage(products.error)}</Alert>
        ) : !data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <p className="py-6 text-sm text-smoke-500">No hay productos con estos filtros.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:mx-0" aria-busy={products.isLoading}>
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-ink-900/10 text-xs text-smoke-500">
                <tr>
                  <th scope="col" className="px-5 py-2 font-semibold sm:px-2">
                    Producto
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Categoría
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">
                    Precio
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">
                    Stock
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-ivory-50">
                    <td className="px-5 py-2 sm:px-2">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt=""
                            className="size-11 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="grid size-11 place-items-center rounded bg-cream-100 text-smoke-500">
                            <ImageOff aria-hidden="true" className="size-4" />
                          </span>
                        )}
                        <div>
                          <Link
                            to={`/admin/productos/${product.id}`}
                            className="font-semibold text-ink-950 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <span className="block text-xs text-smoke-500">
                            <span className="font-mono">{product.sku}</span> · {product.brand.name}
                            {product.isDemo && ' · DEMO'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">{product.category.name}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCOP(product.price)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {product.stock === 0 ? (
                        <Badge tone="danger">Agotado</Badge>
                      ) : product.isLowStock ? (
                        <Badge tone="warning">{product.stock} · bajo</Badge>
                      ) : (
                        <span className="tabular-nums">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={statusTone[product.status]}>
                        {statusLabels[product.status]}
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

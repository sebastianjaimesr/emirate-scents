import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { AdminApiError, adminApi, errorMessage } from '../adminApi'
import { ProductForm } from '../components/ProductForm'
import { ProductImages } from '../components/ProductImages'
import { ProductStock } from '../components/ProductStock'
import { Alert, Badge, Button, ConfirmDialog, Loading, PageTitle } from '../components/ui'
import { emptyProduct, toFormValues, toPayload, type ProductFormValues } from '../productForm'
import {
  statusLabels,
  type AdminProduct,
  type Brand,
  type Category,
  type ProductStatus,
} from '../types'

type Pending = { kind: 'status'; status: ProductStatus } | { kind: 'delete' } | null

/** Crear (/admin/productos/nuevo) o editar (/admin/productos/:id) un producto. */
export function ProductEditPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const location = useLocation()
  const createdNotice = (location.state as { created?: boolean } | null)?.created

  const [reloadKey, setReloadKey] = useState(0)
  // El formulario se reinicia con los datos del servidor solo después de guardarlo: subir
  // fotos o registrar inventario no borra lo que estés escribiendo
  const [formVersion, setFormVersion] = useState(0)
  const [lastSaved, setLastSaved] = useState<AdminProduct>()
  const product = useAsyncData(`producto:${id}:${reloadKey}`, () =>
    id ? adminApi.get<AdminProduct>(`/products/${id}`) : Promise.resolve(null),
  )
  const options = useAsyncData('opciones-producto', () =>
    Promise.all([
      adminApi.get<{ items: Brand[] }>('/brands'),
      adminApi.get<{ items: Category[] }>('/categories'),
    ]),
  )

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  const [saved, setSaved] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string>()

  const current = product.data ?? product.previousData ?? null
  const reload = () => setReloadKey((key) => key + 1)

  async function save(values: ProductFormValues) {
    setSaving(true)
    setFieldErrors({})
    setFormError(undefined)
    setSaved(undefined)
    try {
      if (isNew) {
        const created = await adminApi.post<AdminProduct>('/products', toPayload(values, true))
        navigate(`/admin/productos/${created.id}`, { replace: true, state: { created: true } })
      } else {
        const updated = await adminApi.patch<AdminProduct>(
          `/products/${id}`,
          toPayload(values, false),
        )
        setSaved('Cambios guardados.')
        setLastSaved(updated)
        setFormVersion((version) => version + 1)
        reload()
      }
    } catch (error) {
      if (error instanceof AdminApiError) setFieldErrors(error.fieldErrors)
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function confirmAction() {
    if (!pending || !id) return
    setActionBusy(true)
    setActionError(undefined)
    try {
      if (pending.kind === 'delete') {
        await adminApi.delete(`/products/${id}`)
        navigate('/admin/productos', { replace: true })
        return
      }
      await adminApi.patch(`/products/${id}/status`, { status: pending.status })
      reload()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setActionBusy(false)
      setPending(null)
    }
  }

  if (product.error) return <Alert>{errorMessage(product.error)}</Alert>
  if (options.error) return <Alert>{errorMessage(options.error)}</Alert>
  if ((!isNew && !current) || !options.data) return <Loading />

  const [brands, categories] = options.data
  const status = current?.status

  return (
    <>
      <Link
        to="/admin/productos"
        className="mb-3 inline-flex items-center gap-1 text-sm text-smoke-500 hover:text-ink-950"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Productos
      </Link>
      <PageTitle
        title={current ? current.name : 'Nuevo producto'}
        description={
          current
            ? `${current.sku} · ${current.brand.name}`
            : 'Se guarda como borrador: no aparece en la tienda hasta que lo publiques.'
        }
        actions={
          current &&
          status && (
            <>
              <Badge
                tone={
                  status === 'PUBLICADO' ? 'success' : status === 'BORRADOR' ? 'info' : 'neutral'
                }
              >
                {statusLabels[status]}
              </Badge>
              {status === 'PUBLICADO' && (
                <a
                  href={`/producto/${current.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold hover:bg-ink-900/5"
                >
                  Ver en la tienda <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              )}
              {status !== 'PUBLICADO' && (
                <Button onClick={() => setPending({ kind: 'status', status: 'PUBLICADO' })}>
                  Publicar
                </Button>
              )}
              {status === 'PUBLICADO' && (
                <Button
                  variant="secondary"
                  onClick={() => setPending({ kind: 'status', status: 'BORRADOR' })}
                >
                  Despublicar
                </Button>
              )}
              {status !== 'ARCHIVADO' && (
                <Button
                  variant="secondary"
                  onClick={() => setPending({ kind: 'status', status: 'ARCHIVADO' })}
                >
                  Archivar
                </Button>
              )}
              {current.orderCount === 0 && current.movementCount === 0 && (
                <Button variant="danger" onClick={() => setPending({ kind: 'delete' })}>
                  Eliminar
                </Button>
              )}
            </>
          )
        }
      />

      <div className="space-y-4">
        {createdNotice && (
          <Alert tone="success">
            Producto creado como borrador. Ahora puedes subir sus fotos y, cuando esté listo,
            publicarlo.
          </Alert>
        )}
        {actionError && <Alert>{actionError}</Alert>}
        {current?.isDemo && (
          <Alert tone="info">
            Este es un producto DEMO: aunque esté publicado, la tienda lo muestra con su etiqueta y
            no deja pedirlo.
          </Alert>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <ProductForm
          key={current ? `${current.id}:${formVersion}` : 'nuevo'}
          initialValues={current ? toFormValues(lastSaved ?? current) : emptyProduct}
          isNew={isNew}
          brands={brands.items}
          categories={categories.items}
          fieldErrors={fieldErrors}
          formError={formError}
          saved={saved}
          saving={saving}
          onSubmit={save}
        />
        {current && (
          <>
            <ProductImages product={current} onChange={reload} />
            <ProductStock product={current} onChange={reload} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'delete'
            ? '¿Eliminar este producto?'
            : pending?.status === 'PUBLICADO'
              ? '¿Publicar este producto?'
              : pending?.status === 'ARCHIVADO'
                ? '¿Archivar este producto?'
                : '¿Despublicar este producto?'
        }
        confirmLabel={
          pending?.kind === 'delete'
            ? 'Eliminar'
            : pending?.status === 'PUBLICADO'
              ? 'Publicar'
              : pending?.status === 'ARCHIVADO'
                ? 'Archivar'
                : 'Despublicar'
        }
        danger={pending?.kind === 'delete'}
        busy={actionBusy}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      >
        {pending?.kind === 'delete'
          ? 'Se borra definitivamente, con sus fotos. Esta acción no se puede deshacer.'
          : pending?.status === 'PUBLICADO'
            ? 'Aparecerá en la tienda y los clientes podrán pedirlo.'
            : pending?.status === 'ARCHIVADO'
              ? 'Deja de verse en la tienda. Sus pedidos y su historial se conservan, y puedes volver a publicarlo cuando quieras.'
              : 'Deja de verse en la tienda y vuelve a borrador.'}
      </ConfirmDialog>
    </>
  )
}

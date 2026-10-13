import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatCOP } from '../../lib/formatCOP'
import { paymentMethodLabels } from '../../types/order'
import { AdminApiError, adminApi, errorMessage } from '../adminApi'
import { MovementsTable } from '../components/MovementsTable'
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Loading,
  PageTitle,
  Panel,
  TextField,
} from '../components/ui'
import { formatDateTime } from '../format'
import { parsePesos } from '../productForm'
import { orderStatusLabels, orderStatusTone, type AdminOrder, type OrderStatus } from '../types'

/** Botón de cada cambio de estado. */
const actionLabels: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'Volver a pendiente',
  CONFIRMADO: 'Confirmar pedido',
  EN_PREPARACION: 'Pasar a preparación',
  ENVIADO: 'Marcar como enviado',
  ENTREGADO: 'Marcar como entregado',
  CANCELADO: 'Cancelar pedido',
}

/** Qué pasará al cambiar de estado, para la ventana de confirmación. */
function consequence(order: AdminOrder, status: OrderStatus) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)
  switch (status) {
    case 'CONFIRMADO':
      return `Se descuentan del inventario ${units} unidad(es). Hazlo solo después de confirmar el pedido con el cliente por WhatsApp.`
    case 'EN_PREPARACION':
      return 'Indica que estás alistando el pedido. No cambia el inventario.'
    case 'ENVIADO':
      return 'El pedido salió hacia el cliente. No cambia el inventario.'
    case 'ENTREGADO':
      return 'El cliente recibió el pedido. Es un estado final: después no se podrá cambiar.'
    case 'CANCELADO':
      return order.stockDeductedAt
        ? `Las ${units} unidad(es) vuelven al inventario. Es un estado final: después no se podrá cambiar.`
        : 'No cambia el inventario, porque aún no se había descontado. Es un estado final: después no se podrá cambiar.'
    default:
      return ''
  }
}

/** Detalle de un pedido: productos con sus precios de ese momento, cliente, envío y estados. */
export function OrderDetailPage() {
  const { id = '' } = useParams()
  const [reloadKey, setReloadKey] = useState(0)
  const loaded = useAsyncData(`pedido:${id}:${reloadKey}`, () =>
    adminApi.get<AdminOrder>(`/orders/${id}`),
  )
  // Tras un cambio se muestra la respuesta del servidor, que ya trae el pedido actualizado
  const [updated, setUpdated] = useState<AdminOrder>()
  const order = [updated, loaded.data, loaded.previousData].find(
    (candidate) => candidate?.id === id,
  )

  const [pending, setPending] = useState<OrderStatus | null>(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  if (loaded.error && !order) return <Alert>{errorMessage(loaded.error)}</Alert>
  if (!order) return <Loading />

  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const shortages =
    order.status === 'PENDIENTE_CONFIRMACION'
      ? order.items.filter((item) => !item.product || item.product.stock < item.quantity)
      : []

  function apply(next: AdminOrder, message: string) {
    setUpdated(next)
    setNotice(message)
  }

  function openDialog(status: OrderStatus) {
    setPending(status)
    setNote('')
    setNoteError(undefined)
    setActionError(undefined)
    setNotice(undefined)
  }

  async function confirmChange() {
    if (!pending) return
    if (pending === 'CANCELADO' && note.trim().length < 3) {
      setNoteError('Escribe el motivo de la cancelación')
      return
    }
    setBusy(true)
    try {
      const next = await adminApi.patch<AdminOrder>(`/orders/${id}/status`, {
        status: pending,
        note: note.trim(),
      })
      apply(next, `Pedido ${orderStatusLabels[next.status].toLowerCase()}.`)
      setPending(null)
    } catch (error) {
      if (error instanceof AdminApiError && error.fieldErrors.note) {
        setNoteError(error.fieldErrors.note)
      } else {
        setActionError(errorMessage(error))
        setPending(null)
        // Si el pedido cambió desde otra pestaña, se recarga para ver su estado real
        setUpdated(undefined)
        setReloadKey((key) => key + 1)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link
        to="/admin/pedidos"
        className="mb-3 inline-flex items-center gap-1 text-sm text-smoke-500 hover:text-ink-950"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Pedidos
      </Link>
      <PageTitle
        title={`Pedido ${order.orderNumber}`}
        description={`Recibido el ${formatDateTime(order.createdAt)} · ${paymentMethodLabels[order.paymentMethod]}`}
        actions={
          <Badge tone={orderStatusTone[order.status]}>{orderStatusLabels[order.status]}</Badge>
        }
      />

      <div className="space-y-4">
        {notice && <Alert tone="success">{notice}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel title="Productos">
            <p className="mb-3 text-xs text-smoke-500">
              Nombres y precios del momento del pedido: no cambian aunque edites el producto.
            </p>
            <div className="-mx-5 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="border-b border-ink-900/10 text-xs text-smoke-500">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-semibold sm:px-2">
                      Producto
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      Precio
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      Cant.
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-2 sm:px-2">
                        {item.product ? (
                          <Link
                            to={`/admin/productos/${item.product.id}`}
                            className="font-semibold text-ink-950 hover:underline"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="font-semibold">{item.name}</span>
                        )}
                        <span className="block text-xs text-smoke-500">
                          <span className="font-mono">{item.sku}</span> · {item.brandName}
                          {item.sizeMl !== null && ` · ${item.sizeMl} ml`}
                          {order.status === 'PENDIENTE_CONFIRMACION' && item.product && (
                            <> · Quedan {item.product.stock}</>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatCOP(item.unitPrice)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatCOP(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-smoke-500">Subtotal ({units} u.)</dt>
                <dd className="tabular-nums">{formatCOP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-smoke-500">Envío</dt>
                <dd className="tabular-nums">
                  {order.shippingCost === null
                    ? 'Por cotizar'
                    : order.shippingCost === 0
                      ? 'Gratis'
                      : formatCOP(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink-900/10 pt-1 font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums" data-testid="order-total">
                  {formatCOP(order.total)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Historial del pedido">
            <ol className="space-y-3 text-sm">
              <li>
                <span className="font-semibold">Pedido recibido desde la tienda</span>
                <span className="block text-xs text-smoke-500">
                  {formatDateTime(order.createdAt)} · El cliente autorizó el tratamiento de sus
                  datos (política {order.privacyPolicyVersion})
                </span>
              </li>
              {order.history.map((change) => (
                <li key={change.id}>
                  <span className="font-semibold">
                    {orderStatusLabels[change.fromStatus]} → {orderStatusLabels[change.toStatus]}
                  </span>
                  {change.note && <span className="block">{change.note}</span>}
                  <span className="block text-xs text-smoke-500">
                    {formatDateTime(change.createdAt)} · {change.adminName ?? 'Sistema'}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Movimientos de inventario del pedido">
            {order.movements.length === 0 ? (
              <p className="text-sm text-smoke-500">
                Ninguno: las existencias se descuentan al confirmar el pedido.
              </p>
            ) : (
              <MovementsTable movements={order.movements} />
            )}
          </Panel>
        </div>

        {/* En el celular, estado, cliente y envío van primero: son lo que se usa al atender */}
        <div className="order-first min-w-0 space-y-6 lg:order-none">
          <Panel title="Estado">
            {order.allowedTransitions.length === 0 ? (
              <p className="text-sm text-smoke-500">
                Este pedido está {orderStatusLabels[order.status].toLowerCase()}: ya no cambia de
                estado.
              </p>
            ) : (
              <>
                {shortages.length > 0 && (
                  <div className="mb-3">
                    <Alert tone="info">
                      No hay unidades suficientes de {shortages.map((item) => item.name).join(', ')}
                      . Registra una entrada de inventario antes de confirmar.
                    </Alert>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {order.allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      variant={
                        status === 'CANCELADO'
                          ? 'danger'
                          : status === order.allowedTransitions[0]
                            ? 'primary'
                            : 'secondary'
                      }
                      onClick={() => openDialog(status)}
                    >
                      {actionLabels[status]}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Cliente">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-smoke-500">Nombre</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-smoke-500">Celular</dt>
                <dd className="tabular-nums">{order.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-smoke-500">Dirección</dt>
                <dd>
                  {order.customer.address}
                  <span className="block">
                    {order.customer.city}, {order.customer.department}
                  </span>
                </dd>
              </div>
              {order.customer.notes && (
                <div>
                  <dt className="text-xs text-smoke-500">Notas del cliente</dt>
                  <dd className="whitespace-pre-line">{order.customer.notes}</dd>
                </div>
              )}
            </dl>
            <a
              href={`https://wa.me/57${order.customer.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-ink-900/25 px-4 text-sm font-semibold hover:border-ink-900/60"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Escribir por WhatsApp
            </a>
          </Panel>

          <ShippingPanel
            key={`${order.id}:${order.shippingCost}:${order.status}`}
            order={order}
            onSaved={(next) => apply(next, 'Costo de envío guardado.')}
          />
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `¿${actionLabels[pending]}?` : ''}
        confirmLabel={pending ? actionLabels[pending] : ''}
        cancelLabel="Volver"
        danger={pending === 'CANCELADO'}
        busy={busy}
        onConfirm={confirmChange}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <>
            <p>{consequence(order, pending)}</p>
            <TextField
              className="mt-4"
              label={pending === 'CANCELADO' ? 'Motivo de la cancelación' : 'Nota (opcional)'}
              value={note}
              maxLength={300}
              onChange={(event) => {
                setNote(event.target.value)
                setNoteError(undefined)
              }}
              error={noteError}
              hint="Queda en el historial del pedido."
            />
          </>
        )}
      </ConfirmDialog>
    </>
  )
}

/** Costo de envío: vacío = pendiente de cotización; 0 = gratis. El total se recalcula en el servidor. */
function ShippingPanel({
  order,
  onSaved,
}: {
  order: AdminOrder
  onSaved: (order: AdminOrder) => void
}) {
  const [value, setValue] = useState(order.shippingCost === null ? '' : String(order.shippingCost))
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  async function save(event: FormEvent) {
    event.preventDefault()
    const shippingCost = parsePesos(value)
    if (shippingCost !== null && !Number.isInteger(shippingCost)) {
      setError('Escribe el valor en pesos, solo con números')
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      onSaved(await adminApi.patch<AdminOrder>(`/orders/${order.id}/shipping`, { shippingCost }))
    } catch (caught) {
      setError(
        caught instanceof AdminApiError
          ? (caught.fieldErrors.shippingCost ?? errorMessage(caught))
          : errorMessage(caught),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Costo de envío">
      {order.shippingEditable ? (
        <form onSubmit={save} noValidate>
          <TextField
            label="Valor en pesos"
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Por cotizar"
            hint="Déjalo vacío si aún no lo sabes. Escribe 0 si el envío es gratis."
            error={error}
          />
          <Button type="submit" variant="secondary" busy={saving} className="mt-3">
            Guardar envío
          </Button>
        </form>
      ) : (
        <p className="text-sm text-smoke-500">
          {order.shippingCost === null ? 'Quedó sin cotizar.' : `${formatCOP(order.shippingCost)}.`}{' '}
          El pedido está cerrado y ya no se puede cambiar.
        </p>
      )}
    </Panel>
  )
}

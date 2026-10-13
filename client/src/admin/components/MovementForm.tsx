import { useState, type FormEvent } from 'react'
import { AdminApiError, adminApi, errorMessage } from '../adminApi'
import type { AdminProduct, Movement } from '../types'
import { Alert, Button, SelectField, TextField } from './ui'

/**
 * Registrar una entrada de mercancía o un ajuste. Las ventas y devoluciones las registra el
 * sistema al confirmar o cancelar pedidos. El historial no se edita: un error se corrige con
 * otro ajuste.
 */
export function MovementForm({
  fixedProduct,
  products,
  onSaved,
}: {
  /** Producto ya elegido (desde su ficha). */
  fixedProduct?: AdminProduct
  /** Lista para elegir el producto (desde la página de inventario). */
  products?: { id: string; label: string }[]
  onSaved: (movement: Movement) => void
}) {
  const [productId, setProductId] = useState(fixedProduct?.id ?? '')
  const [type, setType] = useState<'ENTRADA' | 'AJUSTE'>('ENTRADA')
  const [direction, setDirection] = useState<'sumar' | 'restar'>('restar')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const units = Number(quantity)
    const signed = type === 'AJUSTE' && direction === 'restar' ? -units : units
    setBusy(true)
    setErrors({})
    setError(undefined)
    setSuccess(undefined)
    try {
      const movement = await adminApi.post<Movement>('/inventory/movements', {
        productId,
        type,
        quantity: quantity.trim() === '' ? undefined : signed,
        reason,
      })
      setSuccess(
        `${type === 'ENTRADA' ? 'Entrada' : 'Ajuste'} registrado: ahora hay ${movement.stockAfter} unidad(es) de ${movement.product.name}.`,
      )
      setQuantity('')
      setReason('')
      onSaved(movement)
    } catch (caught) {
      if (caught instanceof AdminApiError) setErrors(caught.fieldErrors)
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} aria-label="Registrar movimiento de inventario" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!fixedProduct && (
          <SelectField
            label="Producto"
            required
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            error={errors.productId}
            className="sm:col-span-2 lg:col-span-4"
          >
            <option value="">Elige un producto</option>
            {products?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField
          label="Tipo"
          value={type}
          onChange={(event) => setType(event.target.value as 'ENTRADA' | 'AJUSTE')}
          hint={
            type === 'ENTRADA'
              ? 'Llegada de mercancía: suma unidades'
              : 'Corrección: conteo físico, daño, pérdida…'
          }
        >
          <option value="ENTRADA">Entrada de mercancía</option>
          <option value="AJUSTE">Ajuste</option>
        </SelectField>
        {type === 'AJUSTE' && (
          <SelectField
            label="El ajuste"
            value={direction}
            onChange={(event) => setDirection(event.target.value as 'sumar' | 'restar')}
          >
            <option value="restar">Resta unidades</option>
            <option value="sumar">Suma unidades</option>
          </SelectField>
        )}
        <TextField
          label="Unidades"
          type="number"
          min={1}
          max={10000}
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={errors.quantity}
        />
        <TextField
          label="Motivo"
          required
          minLength={3}
          maxLength={200}
          placeholder={type === 'ENTRADA' ? 'Pedido al proveedor 0425' : 'Conteo físico'}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors.reason}
          className={type === 'AJUSTE' ? '' : 'lg:col-span-2'}
        />
      </div>
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      <Button type="submit" busy={busy}>
        Registrar {type === 'ENTRADA' ? 'entrada' : 'ajuste'}
      </Button>
    </form>
  )
}

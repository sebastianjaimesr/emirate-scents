/**
 * Envoltura de los campos del formulario de compra.
 */
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
  children: ReactNode
}

/**
 * Etiqueta, ayuda y mensaje de error de un campo. El campo (children) debe usar
 * `aria-describedby={describedBy(id, …)}` para que los lectores de pantalla lean la ayuda y el error.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-950">
        {label}
        {optional && <span className="ml-1 font-normal text-smoke-500">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-smoke-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={cx('mt-1.5 text-xs font-medium text-ruby-600')}>
          {error}
        </p>
      )}
    </div>
  )
}

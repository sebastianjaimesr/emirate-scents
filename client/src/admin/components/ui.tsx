import { LoaderCircle } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../../lib/cx'

/* Piezas de interfaz del panel: sobrias, legibles y con foco visible. */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-ink-900 text-ivory-50 hover:bg-ink-800',
  secondary: 'border border-ink-900/25 bg-white text-ink-900 hover:border-ink-900/60',
  danger: 'border border-ruby-600/40 bg-white text-ruby-600 hover:bg-ruby-600 hover:text-white',
  ghost: 'text-ink-900 hover:bg-ink-900/5',
}

export function Button({
  variant = 'primary',
  busy = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; busy?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        className,
      )}
    >
      {busy && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

const fieldClasses =
  'mt-1.5 block w-full rounded-md border border-ink-900/20 bg-white px-3 py-2 text-sm text-ink-950 shadow-xs placeholder:text-smoke-500/70 focus:border-gold-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-gold-500 aria-invalid:border-ruby-600 disabled:bg-cream-100'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  className?: string
}

function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-950">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-smoke-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-ruby-600">
          {error}
        </p>
      )}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: string) =>
  [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ') || undefined

export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={fieldClasses}
      />
    </FieldShell>
  )
}

export function TextArea({
  label,
  error,
  hint,
  className,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(fieldClasses, 'min-h-28')}
      />
    </FieldShell>
  )
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={fieldClasses}
      >
        {children}
      </select>
    </FieldShell>
  )
}

export function Checkbox({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="flex gap-3">
      <input
        id={id}
        type="checkbox"
        {...props}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 accent-ink-900"
      />
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink-950">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-smoke-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('rounded-lg border border-ink-900/10 bg-white p-5 sm:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-sans text-base font-bold text-ink-950">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <title>{`${title} · Panel Emirate Scents`}</title>
        <h1 className="font-display text-3xl text-ink-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-smoke-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-900/8 text-ink-900',
  success: 'bg-emerald-700/10 text-emerald-800',
  warning: 'bg-amber-600/15 text-oud-800',
  danger: 'bg-ruby-600/10 text-ruby-600',
  info: 'bg-gold-500/20 text-gold-700',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function Alert({
  tone = 'danger',
  children,
}: {
  tone?: 'danger' | 'success' | 'info'
  children: ReactNode
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'rounded-md border px-4 py-3 text-sm',
        tone === 'danger' && 'border-ruby-600/30 bg-ruby-600/5 text-ruby-600',
        tone === 'success' && 'border-emerald-700/30 bg-emerald-700/5 text-emerald-800',
        tone === 'info' && 'border-gold-700/30 bg-gold-500/10 text-ink-900',
      )}
    >
      {children}
    </div>
  )
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2 py-8 text-sm text-smoke-500">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      {label}
    </p>
  )
}

/**
 * Ventana de confirmación para acciones importantes (borrar, archivar...). Usa <dialog>,
 * que el navegador hace accesible: atrapa el foco y se cierra con Escape.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-white p-6 text-ink-950 shadow-2xl backdrop:bg-ink-950/50"
    >
      <h2 id="confirm-title" className="font-sans text-lg font-bold">
        {title}
      </h2>
      <div className="mt-2 text-sm text-smoke-500">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} busy={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center justify-end gap-3 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span>
        Página {page} de {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </nav>
  )
}

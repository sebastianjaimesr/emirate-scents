import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'outline-dark' | 'outline-light'

const variants: Record<Variant, string> = {
  // Oro sobre texto negro: contraste 8.3:1
  primary: 'bg-gold-500 text-ink-950 hover:bg-gold-300',
  // Para fondos oscuros
  'outline-dark':
    'border border-gold-500/70 text-gold-300 hover:border-gold-300 hover:bg-gold-500/10',
  // Para fondos claros
  'outline-light': 'border border-ink-900/30 text-ink-900 hover:border-ink-900 hover:bg-ink-900/5',
}

interface ButtonLinkProps {
  children: ReactNode
  /** Ruta interna (/catalogo) o enlace externo (https://...). */
  to: string
  variant?: Variant
  className?: string
}

/**
 * Enlace con apariencia de botón. Si `to` es externo, abre en una pestaña nueva
 * de forma segura (rel="noopener noreferrer").
 */
export function ButtonLink({ children, to, variant = 'primary', className }: ButtonLinkProps) {
  const classes = cx(
    'group inline-flex min-h-12 items-center justify-center gap-3 px-7 text-sm font-semibold tracking-[0.08em] uppercase transition-colors duration-300',
    variants[variant],
    className,
  )

  if (/^https?:\/\//.test(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  )
}

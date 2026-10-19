/**
 * Panel lateral deslizable (carrito, menú, filtros) con fondo oscuro y cierre con Escape.
 */
import { X } from 'lucide-react'
import { m } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
import { cx } from '../../lib/cx'

interface DrawerProps {
  /** Título visible y nombre accesible del panel. */
  title: ReactNode
  ariaLabel: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
  tone?: 'dark' | 'light'
  className?: string
}

/**
 * Panel lateral reutilizable (menú móvil, filtros y, en la Fase 4, carrito).
 * Se monta en <body> con un portal para que "position: fixed" siempre
 * se calcule respecto a la pantalla. Úsalo dentro de <AnimatePresence>.
 */
export function Drawer({
  title,
  ariaLabel,
  onClose,
  children,
  footer,
  side = 'right',
  tone = 'light',
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogBehavior(true, onClose, panelRef)
  const offscreen = side === 'left' ? '-100%' : '100%'
  const isDark = tone === 'dark'

  return createPortal(
    <div className={cx('fixed inset-0 z-50', className)}>
      <m.div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cx(
          'absolute inset-y-0 flex w-[min(88vw,26rem)] flex-col',
          side === 'left' ? 'left-0' : 'right-0',
          isDark ? 'bg-ink-950 text-ivory-50' : 'bg-ivory-50 text-ink-900',
        )}
        initial={{ x: offscreen }}
        animate={{ x: 0 }}
        exit={{ x: offscreen }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className={cx(
            'flex h-18 shrink-0 items-center justify-between border-b px-5',
            isDark ? 'border-gold-500/20' : 'border-sand-300',
          )}
        >
          {title}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={cx(
              'grid size-11 place-items-center transition-colors',
              isDark ? 'text-smoke-300 hover:text-gold-300' : 'text-smoke-500 hover:text-ink-950',
            )}
          >
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div
            className={cx(
              'shrink-0 border-t p-5',
              isDark ? 'border-gold-500/20' : 'border-sand-300',
            )}
          >
            {footer}
          </div>
        )}
      </m.div>
    </div>,
    document.body,
  )
}

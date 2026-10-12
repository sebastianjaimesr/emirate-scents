import { TriangleAlert } from 'lucide-react'
import { cx } from '../../lib/cx'

/** Aviso visible siempre que se muestran productos de demostración. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cx(
        'flex items-start gap-3 border border-ruby-600/30 bg-ruby-600/5 px-4 py-3 text-sm text-ink-900',
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-ruby-600"
        strokeWidth={1.75}
      />
      <p>
        <strong className="font-semibold">Catálogo de demostración.</strong> Estos productos, marcas
        y precios son ficticios y no están a la venta. Se reemplazarán por el catálogo real de
        Emirate Scents.
      </p>
    </div>
  )
}

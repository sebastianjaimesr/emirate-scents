import { brand } from '../../config/brand'
import { cx } from '../../lib/cx'

/**
 * Logo completo de la marca, para usar SOLO sobre fondos oscuros.
 * Es una versión provisional con fondo transparente obtenida del PNG original;
 * se reemplazará cuando tengamos el archivo vectorial oficial.
 */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <img
      src="/images/brand/logo-emirate-scents.webp"
      alt={`${brand.name} · ${brand.tagline}`}
      width={640}
      height={641}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cx('h-auto', className)}
    />
  )
}

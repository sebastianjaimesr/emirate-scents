/**
 * Imagen de producto responsive con reserva cuando no hay foto.
 */
import { mediaUrl } from '../../lib/mediaUrl'
import { useState } from 'react'
import { cx } from '../../lib/cx'
import type { ProductImage as ProductImageData } from '../../types/product'
import { ArchPattern } from '../brand/Arch'

interface ProductImageProps {
  image?: ProductImageData
  /** Texto para el estado de reserva (normalmente, el nombre del producto). */
  fallbackLabel: string
  className?: string
  /** true en la imagen principal visible al cargar (mejora la velocidad percibida). */
  priority?: boolean
  sizes?: string
  /** Miniatura pequeña (carrito): el estado de reserva muestra solo el monograma. */
  compact?: boolean
}

/**
 * Imagen de producto con un estado de reserva elegante cuando la foto falta o no carga.
 * El estado de reserva dice claramente "Imagen próximamente": nunca simula una foto real.
 */
export function ProductImage({
  image,
  fallbackLabel,
  className,
  priority = false,
  sizes,
  compact = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!image || hasError) {
    return (
      <div
        role="img"
        aria-label={`${fallbackLabel}: imagen próximamente`}
        className={cx(
          'relative flex size-full flex-col items-center overflow-hidden bg-sand-300/35',
          compact ? 'justify-center' : 'justify-end',
          className,
        )}
      >
        <ArchPattern className="absolute inset-0 text-sand-300" />
        <span
          className={cx(
            'relative font-display text-gold-700/70',
            compact ? 'text-2xl' : 'mb-[12%] text-4xl',
          )}
        >
          ES
        </span>
        {!compact && (
          <span className="relative mb-[8%] bg-ivory-50/80 px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.22em] text-smoke-500 uppercase">
            Imagen próximamente
          </span>
        )}
      </div>
    )
  }

  return (
    <img
      src={mediaUrl(image.url)}
      alt={image.alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setHasError(true)}
      className={cx('size-full object-cover', className)}
    />
  )
}

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
  /**
   * La foto va sobre el escenario negro (.photo-stage): se funde con él ("lighten") para que
   * el fondo negro de la foto deje ver la luz dorada.
   */
  onStage?: boolean
}

/** Las fotos de producto se guardan en 800 × 1000 (4:5): ver server/scripts/productPhotos.ts. */
const PHOTO_WIDTH = 800
const PHOTO_HEIGHT = 1000

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
  onStage = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
    <span className="relative block size-full">
      {/* Mientras la foto llega: brillo dorado suave con el monograma, del tamaño de la foto */}
      {!loaded && (
        <span
          aria-hidden="true"
          className={cx(
            'absolute inset-0 flex animate-pulse items-center justify-center font-display',
            onStage ? 'text-gold-500/25' : 'bg-cream-100 text-gold-700/30',
            compact ? 'text-xl' : 'text-5xl',
          )}
        >
          ES
        </span>
      )}
      <img
        ref={(element) => {
          // Una foto que ya estaba en la caché del navegador llega antes que onLoad
          if (element?.complete && element.naturalWidth > 0) setLoaded(true)
        }}
        src={mediaUrl(image.url)}
        srcSet={image.srcSet && responsiveSrcSet(image.srcSet)}
        alt={image.alt}
        sizes={sizes}
        // Medidas reales: el navegador reserva el espacio y la página no "salta" al cargar
        width={PHOTO_WIDTH}
        height={PHOTO_HEIGHT}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        // contain: la foto se ve completa y con sus proporciones, nunca recortada ni estirada
        className={cx(
          'relative size-full object-contain transition-opacity duration-500 ease-luxe',
          loaded ? 'opacity-100' : 'opacity-0',
          onStage && 'mix-blend-lighten',
          className,
        )}
      />
      {image.illustrative && !compact && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-noir/80 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.2em] whitespace-nowrap text-gold-300/80 uppercase">
          Imagen ilustrativa
        </span>
      )}
      {image.referenceOfOriginal && !compact && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-noir/80 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.2em] whitespace-nowrap text-gold-300/80 uppercase">
          Referencia del original
        </span>
      )}
    </span>
  )
}

/** Cada dirección del srcset pasa por mediaUrl (en GitHub Pages la tienda vive en una subcarpeta). */
function responsiveSrcSet(srcSet: string) {
  return srcSet
    .split(',')
    .map((entry) => {
      const [url = '', descriptor = ''] = entry.trim().split(/\s+/)
      return `${mediaUrl(url)} ${descriptor}`.trim()
    })
    .join(', ')
}

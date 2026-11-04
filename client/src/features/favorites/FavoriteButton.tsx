/**
 * Botón de corazón para marcar o quitar favoritos.
 */
import { Heart } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { cx } from '../../lib/cx'
import { useFavoritesStore, useIsFavorite } from './favoritesStore'

interface FavoriteButtonProps {
  productId: string
  productName: string
  variant?: 'overlay' | 'outline'
  className?: string
}

/** Corazón para guardar o quitar un favorito, con una pequeña animación al marcarlo. */
export function FavoriteButton({
  productId,
  productName,
  variant = 'overlay',
  className,
}: FavoriteButtonProps) {
  const isFavorite = useIsFavorite(productId)
  const toggle = useFavoritesStore((state) => state.toggle)
  const prefersReducedMotion = useReducedMotion()
  // Cada vez que se guarda un favorito, un destello nuevo (la clave reinicia la animación)
  const [burst, setBurst] = useState(0)

  function handleClick() {
    if (!isFavorite && !prefersReducedMotion) setBurst((count) => count + 1)
    toggle(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`
      }
      className={cx(
        'grid place-items-center transition-colors',
        variant === 'overlay'
          ? 'size-10 rounded-full bg-ivory-50/90 text-ink-900 backdrop-blur-sm hover:bg-ivory-50'
          : // relative: el destello se dibuja respecto al botón (el de la tarjeta ya es absolute)
            'relative size-14 border border-ink-900/30 hover:border-ink-900',
        className,
      )}
    >
      <m.span
        key={String(isFavorite)}
        initial={isFavorite ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        className="grid place-items-center"
      >
        <Heart
          aria-hidden="true"
          className={cx('size-5', isFavorite ? 'fill-ruby-600 text-ruby-600' : '')}
          strokeWidth={1.5}
        />
      </m.span>
      <AnimatePresence>{burst > 0 && <FavoriteBurst key={burst} />}</AnimatePresence>
    </button>
  )
}

const SPARKS = 8

/** Destello al guardar: un anillo que se expande y chispas doradas y rubí alrededor. */
function FavoriteBurst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <m.span
        className="absolute inset-0 rounded-full border border-ruby-600"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {Array.from({ length: SPARKS }, (_, index) => {
        const angle = (index / SPARKS) * Math.PI * 2
        return (
          <m.span
            key={index}
            className={cx(
              'absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full',
              index % 2 ? 'bg-gold-500' : 'bg-ruby-600',
            )}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 22, y: Math.sin(angle) * 22, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )
      })}
    </span>
  )
}

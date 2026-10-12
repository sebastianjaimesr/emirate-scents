import { Heart } from 'lucide-react'
import { m } from 'motion/react'
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

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`
      }
      className={cx(
        'grid place-items-center transition-colors',
        variant === 'overlay'
          ? 'size-10 rounded-full bg-ivory-50/90 text-ink-900 backdrop-blur-sm hover:bg-ivory-50'
          : 'size-14 border border-ink-900/30 hover:border-ink-900',
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
    </button>
  )
}

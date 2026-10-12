import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPageItems } from './pageItems'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Paginación numerada. Se oculta si todo cabe en una página. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const buttonClass =
    'grid size-11 place-items-center border text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30'

  return (
    <nav aria-label="Paginación" className="mt-16 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${buttonClass} border-ink-900/20 hover:border-ink-900`}
      >
        <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </button>
      {getPageItems(page, totalPages).map((number, index) =>
        number === '…' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="w-6 text-center text-smoke-500">
            …
          </span>
        ) : (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-label={`Página ${number}`}
            aria-current={number === page ? 'page' : undefined}
            className={`${buttonClass} ${number === page ? 'border-ink-900 bg-ink-900 text-ivory-50' : 'border-ink-900/20 hover:border-ink-900'}`}
          >
            {number}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className={`${buttonClass} border-ink-900/20 hover:border-ink-900`}
      >
        <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </button>
    </nav>
  )
}

import { Search, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
import { Container } from '../ui/Container'

/** Buscador desplegable bajo el header. Envía la búsqueda al catálogo (?q=...). */
export function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogBehavior(true, onClose, panelRef, { lockScroll: false })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/catalogo?q=${encodeURIComponent(term)}` : '/catalogo')
    onClose()
  }

  return (
    <motion.div
      ref={panelRef}
      role="search"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full border-t border-gold-500/20 bg-ink-950 shadow-2xl shadow-black/40"
    >
      <Container className="py-5">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b border-gold-500/50 pb-2"
        >
          <Search aria-hidden="true" className="size-5 shrink-0 text-gold-500" strokeWidth={1.5} />
          <label htmlFor="site-search" className="sr-only">
            Buscar perfumes por nombre o marca
          </label>
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por perfume o marca"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-11 w-full bg-transparent font-display text-2xl text-ivory-50 placeholder:text-smoke-300/70 focus:outline-none sm:text-3xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="grid size-11 shrink-0 place-items-center text-smoke-300 transition-colors hover:text-gold-300"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </form>
      </Container>
    </motion.div>
  )
}

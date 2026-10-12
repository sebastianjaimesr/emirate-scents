import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actions?: ReactNode
  /** 1 cuando el estado vacío es lo único de la página (cada página necesita un h1). */
  headingLevel?: 1 | 2
}

/** Estado vacío elegante (sin favoritos, carrito vacío, catálogo en preparación...). */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <Reveal className="mx-auto flex max-w-xl flex-col items-center py-20 text-center sm:py-28">
      <span className="grid size-20 place-items-center rounded-full border border-gold-700/30 text-gold-700">
        {icon}
      </span>
      <Heading className="mt-8 text-4xl text-ink-950 sm:text-5xl">{title}</Heading>
      <p className="mt-4 text-base leading-relaxed text-smoke-500">{description}</p>
      {actions && <div className="mt-10 flex flex-col gap-3 sm:flex-row">{actions}</div>}
    </Reveal>
  )
}

/**
 * Mensaje de error de carga con botón para reintentar.
 */
import { CloudOff, RotateCw } from 'lucide-react'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { WhatsAppIcon } from '../brand/BrandIcons'
import { ButtonLink } from './ButtonLink'
import { EmptyState } from './EmptyState'

interface LoadErrorProps {
  title: string
  description?: string
  onRetry: () => void
  /** 1 cuando el error ocupa toda la página (ver EmptyState). */
  headingLevel?: 1 | 2
}

/** Error al cargar datos del servidor: explica qué pasó y ofrece reintentar o escribir por WhatsApp. */
export function LoadError({
  title,
  description = 'Revisa tu conexión e intenta de nuevo. Si el problema continúa, escríbenos por WhatsApp.',
  onRetry,
  headingLevel,
}: LoadErrorProps) {
  return (
    <EmptyState
      icon={<CloudOff className="size-8" strokeWidth={1.25} />}
      title={title}
      headingLevel={headingLevel}
      description={description}
      actions={
        <>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-gold-500 px-7 text-sm font-semibold tracking-[0.08em] text-ink-950 uppercase transition-colors hover:bg-gold-300"
          >
            <RotateCw aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Intentar de nuevo
          </button>
          <ButtonLink to={buildWhatsAppUrl(whatsappMessages.general)} variant="outline-light">
            <WhatsAppIcon className="size-5" />
            Escribir por WhatsApp
          </ButtonLink>
        </>
      }
    />
  )
}

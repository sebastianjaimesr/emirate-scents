import { Container } from './Container'

/** Cabecera oscura de las páginas interiores. */
export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string
  title: string
  lead?: string
}) {
  return (
    <div className="bg-ink-950 text-ivory-50">
      <Container className="py-16 text-center sm:py-20">
        <p className="eyebrow text-gold-500">{eyebrow}</p>
        <h1 className="mt-4 text-5xl leading-none sm:text-6xl">{title}</h1>
        {lead && (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-smoke-300">{lead}</p>
        )}
      </Container>
    </div>
  )
}

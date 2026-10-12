import { Compass } from 'lucide-react'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageMeta } from '../components/ui/PageMeta'

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Página no encontrada" description="La página que buscas no existe." />
      <Container>
        <EmptyState
          icon={<Compass className="size-8" strokeWidth={1.25} />}
          headingLevel={1}
          title="Esta página no existe"
          description="Es posible que el enlace haya cambiado. Te invitamos a volver al inicio o explorar el catálogo."
          actions={
            <>
              <ButtonLink to="/">Volver al inicio</ButtonLink>
              <ButtonLink to="/catalogo" variant="outline-light">
                Ver catálogo
              </ButtonLink>
            </>
          }
        />
      </Container>
    </>
  )
}

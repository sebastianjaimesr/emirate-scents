import { Heart } from 'lucide-react'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'

/** Favoritos. En la Fase 4 se conectará al almacenamiento local del navegador. */
export function FavoritesPage() {
  return (
    <>
      <PageMeta title="Favoritos" description="Tus perfumes favoritos de Emirate Scents." />
      <PageHeader eyebrow="Tu selección" title="Favoritos" />
      <Container>
        <EmptyState
          icon={<Heart className="size-8" strokeWidth={1.25} />}
          title="Aún no tienes favoritos"
          description="Guarda aquí las fragancias que te enamoren para encontrarlas fácilmente después."
          actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
        />
      </Container>
    </>
  )
}

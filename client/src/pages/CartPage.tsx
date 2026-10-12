import { ShoppingBag } from 'lucide-react'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'

/** Carrito. En la Fase 4 se añadirán productos, cantidades y totales. */
export function CartPage() {
  return (
    <>
      <PageMeta title="Carrito" description="Tu carrito de compras en Emirate Scents." />
      <PageHeader eyebrow="Tu pedido" title="Carrito" />
      <Container>
        <EmptyState
          icon={<ShoppingBag className="size-8" strokeWidth={1.25} />}
          title="Tu carrito está vacío"
          description="Cuando agregues fragancias, aquí verás el resumen de tu pedido antes de enviarlo por WhatsApp."
          actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
        />
      </Container>
    </>
  )
}

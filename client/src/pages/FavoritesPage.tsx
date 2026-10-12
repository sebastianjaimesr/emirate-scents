import { Heart } from 'lucide-react'
import { ProductGrid, ProductGridSkeleton } from '../components/products/ProductGrid'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { useFavoritesStore } from '../features/favorites/favoritesStore'
import { useAsyncData } from '../hooks/useAsyncData'
import { getProductsByIds } from '../services/productService'

/** Favoritos guardados en este navegador. */
export function FavoritesPage() {
  const productIds = useFavoritesStore((state) => state.productIds)
  const products = useAsyncData(`favorites:${productIds.join(',')}`, () =>
    getProductsByIds(productIds),
  )
  // Mientras se recarga (p. ej. al quitar uno), seguimos mostrando la lista anterior filtrada
  const visible = (products.data ?? products.previousData ?? []).filter((product) =>
    productIds.includes(product.id),
  )

  return (
    <>
      <PageMeta title="Favoritos" description="Tus perfumes favoritos de Emirate Scents." />
      <PageHeader
        eyebrow="Tu selección"
        title="Favoritos"
        lead={productIds.length > 0 ? 'Guardados en este navegador.' : undefined}
      />
      <Container className="py-12 lg:py-16">
        {productIds.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-8" strokeWidth={1.25} />}
            title="Aún no tienes favoritos"
            description="Toca el corazón de cualquier fragancia para guardarla aquí y encontrarla fácilmente después."
            actions={<ButtonLink to="/catalogo">Explorar catálogo</ButtonLink>}
          />
        ) : !products.data && !products.previousData ? (
          <ProductGridSkeleton count={Math.min(productIds.length, 8)} />
        ) : (
          <ProductGrid products={visible} />
        )}
      </Container>
    </>
  )
}

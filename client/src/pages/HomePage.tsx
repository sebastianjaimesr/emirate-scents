import { PageMeta } from '../components/ui/PageMeta'
import { CategoriesSection } from '../features/home/CategoriesSection'
import { FaqSection } from '../features/home/FaqSection'
import { HeroSection } from '../features/home/HeroSection'
import { ManifestoSection } from '../features/home/ManifestoSection'
import { OlfactoryFamiliesSection } from '../features/home/OlfactoryFamiliesSection'
import { OrderStepsSection } from '../features/home/OrderStepsSection'
import { ProductHighlightSection } from '../features/home/ProductHighlightSection'
import { PedestalGallery } from '../features/gallery/PedestalGallery'
import { NotesPyramid } from '../features/notesPyramid/NotesPyramid'

/*
  Las secciones de productos solo aparecen si hay productos que las respalden:
  - Recomendados: marcados como recomendación editorial (isFeatured).
  - Novedades: marcados como nuevos (isNew).
  - Más vendidos: solo con datos reales de ventas (isBestSeller). Hoy no hay ninguno.
  "Ofertas" se añadirá cuando existan descuentos reales.
*/
export function HomePage() {
  return (
    <>
      <PageMeta description="Perfumes árabes, de diseñador, de nicho y equivalencias. Asesoría y pedidos por WhatsApp con pago contra entrega sujeto a confirmación." />
      <HeroSection />
      {/* Destino del botón "Descubrir perfumes": las secciones 3D, o las colecciones si no hay productos */}
      <div id="coleccion">
        <PedestalGallery />
        <CategoriesSection />
      </div>
      <ProductHighlightSection
        kind="recomendados"
        eyebrow="Selección editorial"
        title="Recomendados por la casa"
        lead="Fragancias que elegimos por su carácter y calidad."
        catalogLink="/catalogo"
        background="bg-cream-100"
      />
      <ManifestoSection />
      <ProductHighlightSection
        kind="novedades"
        eyebrow="Recién llegados"
        title="Novedades"
        lead="Las últimas fragancias incorporadas al catálogo."
        catalogLink="/catalogo?orden=novedades"
      />
      <ProductHighlightSection
        kind="mas-vendidos"
        eyebrow="Favoritos de nuestros clientes"
        title="Más vendidos"
        lead="Las fragancias más pedidas."
        catalogLink="/catalogo"
        background="bg-cream-100"
      />
      <NotesPyramid />
      <OlfactoryFamiliesSection />
      <OrderStepsSection />
      <FaqSection />
    </>
  )
}

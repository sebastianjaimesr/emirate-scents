import { PageMeta } from '../components/ui/PageMeta'
import { CategoriesSection } from '../features/home/CategoriesSection'
import { FaqSection } from '../features/home/FaqSection'
import { HeroSection } from '../features/home/HeroSection'
import { ManifestoSection } from '../features/home/ManifestoSection'
import { OlfactoryFamiliesSection } from '../features/home/OlfactoryFamiliesSection'
import { OrderStepsSection } from '../features/home/OrderStepsSection'

/*
  Las secciones de "Más vendidos", "Recomendados", "Novedades", "Colección premium"
  y "Ofertas" se añadirán en la Fase 3, y solo se mostrarán cuando existan
  productos reales que las respalden.
*/
export function HomePage() {
  return (
    <>
      <PageMeta description="Perfumes árabes, de diseñador, de nicho y equivalencias. Asesoría y pedidos por WhatsApp con pago contra entrega sujeto a confirmación." />
      <HeroSection />
      <CategoriesSection />
      <ManifestoSection />
      <OlfactoryFamiliesSection />
      <OrderStepsSection />
      <FaqSection />
    </>
  )
}

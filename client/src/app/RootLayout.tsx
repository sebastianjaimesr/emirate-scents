import { LazyMotion, m, MotionConfig } from 'motion/react'
import { Outlet, ScrollRestoration, useMatches } from 'react-router'
import { ArchClipDefs } from '../components/brand/Arch'
import { AnnouncementBar } from '../components/layout/AnnouncementBar'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { WhatsAppFloatingButton } from '../components/layout/WhatsAppFloatingButton'
import { CartDrawer } from '../features/cart/CartDrawer'
import { CartFlightLayer } from '../features/cart/CartFlight'

/**
 * Estructura común a todas las páginas.
 * MotionConfig reducedMotion="user" respeta la preferencia del sistema
 * "reducir movimiento": las animaciones se convierten en fundidos simples.
 * LazyMotion descarga el motor de animaciones después de mostrar la página,
 * así la primera carga pesa menos (los componentes usan `m.div` en lugar de `motion.div`).
 */
const loadMotionFeatures = () => import('../lib/motionFeatures').then((module) => module.default)

/**
 * Estructura común de la tienda: encabezado, contenido de la página con transición, pie de página y botón de WhatsApp.
 */
export function RootLayout() {
  // Cada tipo de página (inicio, catálogo, ficha...) entra con un fundido suave. Se usa el id de
  // la ruta y no la dirección: cambiar de categoría o de filtros no repite la transición.
  const matches = useMatches()
  const routeId = matches.at(-1)?.id

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <a
          href="#contenido"
          className="sr-only z-50 bg-gold-500 px-4 py-3 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <ArchClipDefs />
        <AnnouncementBar />
        <Header />
        <main id="contenido" tabIndex={-1} className="focus:outline-none">
          <m.div
            key={routeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </m.div>
        </main>
        <Footer />
        <WhatsAppFloatingButton />
        <CartDrawer />
        <CartFlightLayer />
        <ScrollRestoration />
      </MotionConfig>
    </LazyMotion>
  )
}

import { LazyMotion, MotionConfig } from 'motion/react'
import { Outlet, ScrollRestoration } from 'react-router'
import { ArchClipDefs } from '../components/brand/Arch'
import { AnnouncementBar } from '../components/layout/AnnouncementBar'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { WhatsAppFloatingButton } from '../components/layout/WhatsAppFloatingButton'
import { CartDrawer } from '../features/cart/CartDrawer'

/**
 * Estructura común a todas las páginas.
 * MotionConfig reducedMotion="user" respeta la preferencia del sistema
 * "reducir movimiento": las animaciones se convierten en fundidos simples.
 * LazyMotion descarga el motor de animaciones después de mostrar la página,
 * así la primera carga pesa menos (los componentes usan `m.div` en lugar de `motion.div`).
 */
const loadMotionFeatures = () => import('../lib/motionFeatures').then((module) => module.default)

export function RootLayout() {
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
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFloatingButton />
        <CartDrawer />
        <ScrollRestoration />
      </MotionConfig>
    </LazyMotion>
  )
}

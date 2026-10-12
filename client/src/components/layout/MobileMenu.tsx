import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router'
import { brand } from '../../config/brand'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '../brand/BrandIcons'
import { Wordmark } from '../brand/Wordmark'
import { mainNavigation } from './navigation'

/**
 * Menú lateral para móviles y tablets.
 * Se renderiza con un portal directamente en <body>: el header usa
 * backdrop-blur, y eso haría que un elemento "fixed" dentro de él se
 * posicionara respecto al header y no respecto a la pantalla.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogBehavior(true, onClose, panelRef)

  return createPortal(
    <div className="fixed inset-0 z-50 xl:hidden">
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        className="absolute inset-y-0 left-0 flex w-[min(88vw,24rem)] flex-col bg-ink-950 text-ivory-50"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex h-18 items-center justify-between border-b border-gold-500/20 px-5">
          <Wordmark className="items-start text-gold-500" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="grid size-11 place-items-center text-smoke-300 transition-colors hover:text-gold-300"
          >
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>

        <nav aria-label="Principal" className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-1">
            {mainNavigation.map((item, index) => (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
              >
                <NavLink
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-13 items-center border-b border-ivory-50/10 font-display text-3xl transition-colors hover:text-gold-300 ${isActive ? 'text-gold-300' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </motion.li>
            ))}
          </ul>
          <ul className="mt-8 space-y-1 text-sm text-smoke-300">
            <li>
              <NavLink
                to="/favoritos"
                onClick={onClose}
                className="flex min-h-11 items-center hover:text-gold-300"
              >
                Favoritos
              </NavLink>
            </li>
            <li>
              <a
                href="/#como-pedir"
                onClick={onClose}
                className="flex min-h-11 items-center hover:text-gold-300"
              >
                Cómo pedir
              </a>
            </li>
            <li>
              <a
                href="/#preguntas-frecuentes"
                onClick={onClose}
                className="flex min-h-11 items-center hover:text-gold-300"
              >
                Preguntas frecuentes
              </a>
            </li>
          </ul>
        </nav>

        <div className="space-y-3 border-t border-gold-500/20 px-5 py-6 text-sm">
          <a
            href={buildWhatsAppUrl(whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 text-gold-300"
          >
            <WhatsAppIcon className="size-5" /> WhatsApp {brand.whatsappDisplay}
          </a>
          <a
            href={brand.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 text-smoke-300 hover:text-gold-300"
          >
            <InstagramIcon className="size-5" /> {brand.instagramHandle}
          </a>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

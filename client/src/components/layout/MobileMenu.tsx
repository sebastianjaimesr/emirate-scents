import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { brand } from '../../config/brand'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '../brand/BrandIcons'
import { Wordmark } from '../brand/Wordmark'
import { Drawer } from '../ui/Drawer'
import { mainNavigation } from './navigation'

/** Menú lateral para móviles y tablets. */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      side="left"
      tone="dark"
      className="xl:hidden"
      ariaLabel="Menú principal"
      title={<Wordmark className="items-start text-gold-500" />}
      onClose={onClose}
      footer={
        <div className="space-y-1 text-sm">
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
      }
    >
      <nav aria-label="Principal" className="px-5 py-6">
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
    </Drawer>
  )
}

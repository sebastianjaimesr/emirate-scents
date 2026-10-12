import { Heart, Menu, Search, ShoppingBag } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { WhatsAppIcon } from '../brand/BrandIcons'
import { Wordmark } from '../brand/Wordmark'
import { Container } from '../ui/Container'
import { MobileMenu } from './MobileMenu'
import { SearchPanel } from './SearchPanel'
import { mainNavigation } from './navigation'

const iconButton =
  'relative grid size-11 place-items-center text-ivory-50/85 transition-colors duration-300 hover:text-gold-300'

export function Header() {
  const { pathname } = useLocation()
  // Guardamos en qué página se abrió cada panel: si la página cambia
  // (por ejemplo, con el botón "atrás"), el panel se considera cerrado.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const [searchOpenedAt, setSearchOpenedAt] = useState<string | null>(null)
  const isMenuOpen = menuOpenedAt === pathname
  const isSearchOpen = searchOpenedAt === pathname

  const closeMenu = useCallback(() => setMenuOpenedAt(null), [])
  const closeSearch = useCallback(() => setSearchOpenedAt(null), [])

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/15 bg-ink-950/95 text-ivory-50 backdrop-blur-md">
      <Container className="grid h-18 grid-cols-[1fr_auto_1fr] items-center xl:h-22">
        {/* Izquierda: menú (móvil) o navegación (escritorio) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpenedAt(pathname)}
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
            className={`${iconButton} -ml-3 xl:hidden`}
          >
            <Menu className="size-6" strokeWidth={1.5} />
          </button>
          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-7">
              {mainNavigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `group relative py-2 text-[0.72rem] font-semibold tracking-[0.16em] uppercase transition-colors hover:text-gold-300 ${isActive ? 'text-gold-300' : 'text-ivory-50/80'}`
                    }
                  >
                    {item.label}
                    <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-500 transition-transform duration-500 ease-luxe group-hover:scale-x-100" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Centro: marca */}
        <Link
          to="/"
          aria-label="Emirate Scents, ir al inicio"
          className="text-gold-500 transition-colors hover:text-gold-300"
        >
          <Wordmark />
        </Link>

        {/* Derecha: acciones */}
        <div className="-mr-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSearchOpenedAt(isSearchOpen ? null : pathname)}
            aria-label={isSearchOpen ? 'Cerrar buscador' : 'Buscar'}
            aria-expanded={isSearchOpen}
            className={iconButton}
          >
            <Search className="size-5" strokeWidth={1.5} />
          </button>
          <a
            href={buildWhatsAppUrl(whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
            className={`${iconButton} hidden sm:grid`}
          >
            <WhatsAppIcon className="size-5" />
          </a>
          <Link to="/favoritos" aria-label="Favoritos" className={`${iconButton} hidden sm:grid`}>
            <Heart className="size-5" strokeWidth={1.5} />
          </Link>
          <Link to="/carrito" aria-label="Carrito de compras" className={iconButton}>
            <ShoppingBag className="size-5" strokeWidth={1.5} />
          </Link>
        </div>
      </Container>

      <AnimatePresence>{isSearchOpen && <SearchPanel onClose={closeSearch} />}</AnimatePresence>
      <AnimatePresence>{isMenuOpen && <MobileMenu onClose={closeMenu} />}</AnimatePresence>
    </header>
  )
}

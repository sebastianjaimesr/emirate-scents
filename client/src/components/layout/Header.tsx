import { Heart, Menu, Search, ShoppingBag } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { countItems } from '../../features/cart/cartItems'
import { useCartStore } from '../../features/cart/cartStore'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'
import { parseCatalogQuery } from '../../features/catalog/catalogQuery'
import {
  findGenderSection,
  genderLink,
  useGenderMenus,
} from '../../features/catalog/genderSections'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { WhatsAppIcon } from '../brand/BrandIcons'
import { Wordmark } from '../brand/Wordmark'
import { Container } from '../ui/Container'
import { MobileMenu } from './MobileMenu'
import { SearchPanel } from './SearchPanel'
import { categories } from '../../data/categories'

/** Contador sobre un icono; hace un pequeño "pulso" cada vez que cambia. */
function CountBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <m.span
      key={count}
      aria-hidden="true"
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
      className="absolute top-1 right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gold-500 px-1 text-[0.6rem] font-bold text-ink-950 tabular-nums"
    >
      {count > 99 ? '99+' : count}
    </m.span>
  )
}

const iconButton =
  'relative grid size-11 place-items-center text-ivory-50/85 transition-colors duration-300 hover:text-gold-300'

const navLinkClass =
  'group relative block py-2 text-[0.72rem] font-semibold tracking-[0.16em] uppercase transition-colors hover:text-gold-300'

/** Enlace del menú de escritorio con su lista desplegable de categorías. */
function DesktopMenu({
  label,
  to,
  items,
  allLabel,
  active,
}: {
  active: boolean
  label: string
  to: string
  items: { label: string; to: string }[]
  allLabel: string
}) {
  return (
    <li className="group/menu relative">
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        className={`${navLinkClass} ${active ? 'text-gold-300' : 'text-ivory-50/80'}`}
      >
        {label}
        <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-500 transition-transform duration-500 ease-luxe group-hover:scale-x-100" />
      </Link>
      {items.length > 0 && (
        <div className="invisible absolute top-full -left-5 z-10 pt-4 opacity-0 transition-[opacity,visibility] duration-300 group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
          <ul
            aria-label={`Categorías de ${label}`}
            className="min-w-60 border border-gold-500/20 bg-ink-950 py-3 shadow-2xl"
          >
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-10 items-center px-5 text-sm text-ivory-50/80 transition-colors hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-ivory-50/10 pt-2">
              <Link
                to={to}
                className="flex min-h-10 items-center px-5 text-[0.68rem] font-semibold tracking-[0.16em] text-gold-300 uppercase hover:text-gold-500"
              >
                {allLabel}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </li>
  )
}

/** Encabezado fijo de la tienda: logo, navegación, buscador, favoritos, carrito y menú en celulares. */
export function Header() {
  const { pathname, search } = useLocation()
  // Hombre / Mujer se marcan cuando el catálogo está filtrado por su público
  const onCatalog = pathname.startsWith('/catalogo')
  const activeGender = onCatalog
    ? findGenderSection(parseCatalogQuery(new URLSearchParams(search)).audiences)
    : undefined
  // Guardamos en qué página se abrió cada panel: si la página cambia
  // (por ejemplo, con el botón "atrás"), el panel se considera cerrado.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const [searchOpenedAt, setSearchOpenedAt] = useState<string | null>(null)
  const isMenuOpen = menuOpenedAt === pathname
  const isSearchOpen = searchOpenedAt === pathname

  const cartCount = useCartStore((state) => countItems(state.items))
  const openCart = useCartStore((state) => state.openDrawer)
  const favoritesCount = useFavoritesStore((state) => state.productIds.length)

  const genderMenus = useGenderMenus()
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
            <ul className="flex items-center gap-8">
              {/* Hombre / Mujer / Catálogo: al pasar el cursor (o con el teclado) muestran sus categorías */}
              {genderMenus.map(({ section, categories }) => (
                <DesktopMenu
                  key={section.slug}
                  active={activeGender === section}
                  label={section.label}
                  to={genderLink(section)}
                  items={categories.map((category) => ({ label: category.name, to: category.to }))}
                  allLabel={`Ver todo ${section.label}`}
                />
              ))}
              <DesktopMenu
                active={onCatalog && !activeGender}
                label="Catálogo"
                to="/catalogo"
                items={categories.map((category) => ({
                  label: category.name,
                  to: `/catalogo/${category.slug}`,
                }))}
                allLabel="Ver todo el catálogo"
              />
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
          <Link
            to="/favoritos"
            aria-label={favoritesCount > 0 ? `Favoritos (${favoritesCount})` : 'Favoritos'}
            className={`${iconButton} hidden sm:grid`}
          >
            <Heart className="size-5" strokeWidth={1.5} />
            <CountBadge count={favoritesCount} />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={
              cartCount > 0
                ? `Abrir carrito (${cartCount} ${cartCount === 1 ? 'producto' : 'productos'})`
                : 'Abrir carrito'
            }
            // Destino de la animación "vuela al carrito" (features/cart/CartFlight)
            data-cart-target
            className={iconButton}
          >
            <ShoppingBag className="size-5" strokeWidth={1.5} />
            <CountBadge count={cartCount} />
          </button>
        </div>
      </Container>

      <AnimatePresence>{isSearchOpen && <SearchPanel onClose={closeSearch} />}</AnimatePresence>
      <AnimatePresence>{isMenuOpen && <MobileMenu onClose={closeMenu} />}</AnimatePresence>
    </header>
  )
}

/**
 * Estructura del panel de administración: menú lateral con las secciones y área de contenido.
 */
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Tags,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Wordmark } from '../../components/brand/Wordmark'
import { cx } from '../../lib/cx'
import { adminApi } from '../adminApi'
import { useAdminSession, type AdminUser } from '../session'

const navigation = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ReceiptText, end: false },
  { to: '/admin/productos', label: 'Productos', icon: Package, end: false },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes, end: false },
  { to: '/admin/catalogo', label: 'Categorías y marcas', icon: Tags, end: false },
]

/** Estructura del panel: menú lateral (arriba en celulares) y el contenido de cada sección. */
export function AdminLayout({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState('')
  const { pathname } = useLocation()
  // Al cambiar de sección en el celular, el menú se cierra solo
  if (menuOpen && menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  async function logout() {
    try {
      await adminApi.post('/auth/logout')
    } finally {
      useAdminSession.getState().signOut('Cerraste la sesión.')
    }
  }

  return (
    <div className="min-h-svh bg-[#f4efe6] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#panel-contenido"
        className="sr-only z-50 bg-gold-500 px-4 py-3 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 bg-ink-950 text-ivory-50 lg:h-svh">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-6 lg:py-8">
          <div className="text-gold-500">
            <Wordmark className="scale-90 items-start! lg:scale-100" />
            <p className="mt-2 hidden text-[0.65rem] font-semibold tracking-[0.3em] text-smoke-300 uppercase lg:block">
              Panel
            </p>
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => {
              setMenuPath(pathname)
              setMenuOpen((open) => !open)
            }}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </div>
        <div
          id="admin-menu"
          className={cx(
            'border-t border-white/10 px-3 pb-4 lg:flex lg:h-[calc(100svh-8.5rem)] lg:flex-col lg:border-0 lg:px-4',
            menuOpen ? 'block' : 'hidden lg:flex',
          )}
        >
          <nav aria-label="Secciones del panel" className="mt-3 space-y-1 lg:mt-0">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gold-500 text-ink-950'
                      : 'text-ivory-50/80 hover:bg-white/5 hover:text-ivory-50',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 space-y-1 border-t border-white/10 pt-4 lg:mt-auto">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ivory-50/80 hover:bg-white/5 hover:text-ivory-50"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              Ver la tienda
            </a>
            <p className="px-3 pt-2 text-xs text-smoke-300">
              <span className="block font-semibold text-ivory-50">{admin.name}</span>
              {admin.email}
            </p>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ivory-50/80 hover:bg-white/5 hover:text-ivory-50"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main
        id="panel-contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 focus:outline-none sm:px-6 lg:px-10 lg:py-10"
      >
        {children}
      </main>
    </div>
  )
}

import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { adminApi } from './adminApi'
import { AdminLayout } from './components/AdminLayout'
import { Loading } from './components/ui'
import { CatalogSettingsPage } from './pages/CatalogSettingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductEditPage } from './pages/ProductEditPage'
import { ProductsPage } from './pages/ProductsPage'
import { useAdminSession, type AdminUser } from './session'

/**
 * Panel administrativo (/admin). Su código solo se descarga al entrar aquí: un cliente de la
 * tienda nunca lo recibe. Tampoco se incluye en la versión de GitHub Pages (ver router.tsx).
 *
 * Al abrirlo pregunta a la API quién está conectado (la cookie de sesión viaja sola). Sin
 * sesión, muestra el inicio de sesión; la seguridad real está en el servidor, que comprueba
 * la sesión en cada petición.
 */
export function AdminApp() {
  const state = useAdminSession((store) => store.state)
  const { signIn, signOut } = useAdminSession.getState()

  useEffect(() => {
    adminApi
      .get<{ admin: AdminUser }>('/auth/me')
      .then(({ admin }) => signIn(admin))
      .catch(() => signOut())
  }, [signIn, signOut])

  return (
    <>
      {/* Fuera de los buscadores (el servidor también envía X-Robots-Tag) */}
      <meta name="robots" content="noindex, nofollow" />
      {state.status === 'checking' ? (
        <div className="grid min-h-svh place-items-center bg-ivory-50">
          <Loading label="Comprobando la sesión…" />
        </div>
      ) : state.status === 'signed-out' ? (
        <LoginPage notice={state.notice} />
      ) : (
        <AdminLayout admin={state.admin}>
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="pedidos/:id" element={<OrderDetailPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="productos/nuevo" element={<ProductEditPage />} />
            <Route path="productos/:id" element={<ProductEditPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="catalogo" element={<CatalogSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AdminLayout>
      )}
    </>
  )
}

import { createBrowserRouter, type RouteObject } from 'react-router'
import { CartPage } from '../pages/CartPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RootLayout } from './RootLayout'

/**
 * Mapa de URLs de la tienda. Todas las rutas comparten RootLayout (header y footer).
 * El catálogo, el detalle de producto y el pedido se cargan bajo demanda (`lazy`): su código
 * solo se descarga cuando el visitante entra en ellos, y la página de inicio carga más rápido.
 */
/**
 * El panel administrativo solo existe donde la tienda y la API comparten dominio (Railway o tu
 * computador). En GitHub Pages (vista previa, o tienda con VITE_API_URL hacia otro dominio) se
 * excluye: Vite elimina este bloque al compilar y el código del panel ni siquiera se publica.
 */
const ADMIN_ENABLED = import.meta.env.VITE_PREVIEW !== 'true' && !import.meta.env.VITE_API_URL

const adminRoutes: RouteObject[] = ADMIN_ENABLED
  ? [
      {
        path: '/admin/*',
        lazy: async () => ({ Component: (await import('../admin/AdminApp')).AdminApp }),
      },
    ]
  : []

export const router = createBrowserRouter(
  [
    ...adminRoutes,
    {
      path: '/',
      Component: RootLayout,
      children: [
        { index: true, Component: HomePage },
        {
          path: 'catalogo/:categorySlug?',
          lazy: async () => ({ Component: (await import('../pages/CatalogPage')).CatalogPage }),
        },
        {
          path: 'producto/:slug',
          lazy: async () => ({ Component: (await import('../pages/ProductPage')).ProductPage }),
        },
        { path: 'favoritos', Component: FavoritesPage },
        { path: 'carrito', Component: CartPage },
        {
          path: 'pedido',
          lazy: async () => ({ Component: (await import('../pages/CheckoutPage')).CheckoutPage }),
        },
        {
          path: 'pedido/confirmacion',
          lazy: async () => ({
            Component: (await import('../pages/OrderConfirmationPage')).OrderConfirmationPage,
          }),
        },
        {
          path: 'politica-de-datos',
          lazy: async () => ({
            Component: (await import('../pages/PrivacyPolicyPage')).PrivacyPolicyPage,
          }),
        },
        { path: '*', Component: NotFoundPage },
      ],
    },
  ],
  // En GitHub Pages la tienda vive en /emirate-scents/ (ver vite.config.ts)
  { basename: import.meta.env.BASE_URL },
)
